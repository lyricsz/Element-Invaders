window.onload = () => {
    start();
}

const images = document.querySelectorAll("img");

function start(){
    document.getElementById("replay").onclick = play;
    document.getElementById("gameOver").style.display = "none";

    let keypressed = [];

    const elementSaved = {
        earth: 0,
        water: 0,
        fire: 0,
        air: 0
    }

    //canvas and context definition
    window.gCanvas = document.getElementById("canvas");
    [window.gameWidth, window.gameHeight] = [canvas.width, canvas.height];
    window.context = gCanvas.getContext("2d");

    context.imageSmoothingEnabled = false;

    //animation loop
    let lastTime = 0;
    let lasers = [];

    class Game{
        constructor(deltaTime, gameObjects){
            this.deltaTime = deltaTime;
            this.gameObjects = gameObjects;
            this.markedForDeletion = false;
        }
        update(deltaTime){
            this.deltaTime = deltaTime;
            this.gameObjects.forEach(object => {
                if(object.update) object.update(this.deltaTime);
            });
        }
        draw(){
            this.gameObjects.forEach(object => {
                if(object.draw) object.draw();
            });
        }
        filter(){
            this.gameObjects = this.gameObjects.filter(object => !object.markedForDeletion);
            lasers = lasers.filter(laser => !laser.markedForDeletion);
        }
    }

    class GameObject{
        constructor(gravity, updateGravity, maxGravity, maxX, maxY, maxX2, maxY2){
            this.gravity = gravity || 10;
            this.updateGravity = updateGravity || 0.1;
            this.maxGravity = maxGravity || 20;
            this.maxX = maxX;
            this.maxY = maxY;
            this.maxX2 = maxX2;
            this.maxY2 = maxY2;
        }
        update(deltaTime){
            const deltaScale = deltaTime / 100;

            if(this.gravity < -5) {
                this.updateGravity+=2 * (deltaScale);
            } else if (this.updateGravity < 0) {
                this.updateGravity+=0.1 * (deltaScale);          
            }
            this.gravity += this.updateGravity * (deltaScale);
            this.y += this.gravity * (deltaScale);

            this.y = Math.max(this.maxY, Math.min(this.y, this.maxY2));
            this.x = Math.max(this.maxX, Math.min(this.x, this.maxX2));
            if(this.y == this.maxY2) {this.gravity = 0; this.updateGravity = 0;}
        }
    }

    class Player extends GameObject{
        constructor(x, y, width, height){
            super(0.1, 0.4, 20, 20, -100, 200, gameHeight - height - 26);
            [this.x, this.y, this.width, this.height] = [x, y, width, height];
            this.color = "purple";
            this.img = [images[0], images[1]];
            this.frame = 0;
            this.maxFrame = 1;
            this.time = 0;
            this.timeForNextFrame = 60;
        }
        update(deltaTime){
            if(keypressed.includes("ArrowUp")){
                if(this.gravity >= 0) {
                    this.gravity = 0;
                    this.updateGravity = -8;
                }
            }

            if(this.time > this.timeForNextFrame){
                if(this.frame >= this.maxFrame){
                    this.frame = 0;
                } else {
                    this.frame++;
                }
                this.time = 0;
            } else {
                this.time+= 10 * deltaTime / 100;
            }

            if(keypressed.includes("Space")){
                this.fire()
            }

            lasers.forEach(laser => {
                if(checkCollision(laser, this)){
                    ui.health-=10;
                    laser.markedForDeletion = true;
                }
                if(laser.x < 0 || laser.x > gameWidth) laser.markedForDeletion = true;
            });
            if(this.y == this.maxY2) ui.stability--;
            super.update(deltaTime);
        }
        draw(){
            context.drawImage(this.img[this.frame], this.x, this.y);
        }
        fire(){
            ui.bullet--;
            game.gameObjects.push(new Laser(this.x + this.width, this.y + this.height * 0.8, 100, 4));
            lasers.push(game.gameObjects[game.gameObjects.length - 1]);
        }
    }

    class Element extends GameObject{
        constructor(x, y, width, height){
            super(2, 0.1, 3, 0 + 52, -100, gameWidth  , gameHeight - height - 26);
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.start = false;
            this.angle = 0;
            this.time = 0;
            this.waitTime = Math.floor(Math.random() * 200) + 200;
            this.jump = false;
            this.alreadyStart = false;
            this.image = [images[2]];
            this.frameX = Math.floor(Math.random() * 4);
            this.element = ["earth", "water", "fire", "air"];
            this.sElemet = this.element[this.frameX];
        }
        update(deltaTime){
            const deltaScale = deltaTime / 100;

            if(!this.start){
                this.x +=  Math.cos(this.angle * deltaScale);
                this.gravity = 0;
                this.updateGravity = 0;
            } else if(this.start == true && !this.alreadyStart){
                this.gravity = 2;
                this.updateGravity = 0.5;
                this.alreadyStart = true;
            }
            if(this.start){
                this.x -= 0.8 * deltaScale;
            }
            
            this.angle += 0.4;
            this.time += 3 * (deltaScale);
            if(this.time > this.waitTime) {
                this.start = true;
                this.fire();
                if(this.waitTime > 60) this.waitTime -= 20;
                this.time = 0;
            }

            lasers.forEach(laser => {
                if(checkCollision(laser, this)){
                    if(this.gravity < 0) return;
                    else if(this.y + this.height > laser.y + 12) return
                    this.y = laser.y - this.height;
                    this.gravity =   0;
                    this.updateGravity = 0;
                    if(this.x < laser.x + 10) this.jump = true;
                } else {
                    this.updateGravity = 0.5;
                }
            }); 
            if(this.jump){ 
                if(this.gravity >= 0) {
                    this.gravity = -20; 
                    this.updateGravity = -1;
                }
                this.jump = false;
            }
            if(this.y == this.maxY2){
                if(this.x < 80) {
                    ui.score+=200;
                    if(this.sElemet === "fire"){
                        elementSaved.fire++;
                    } else if (this.sElemet === "air"){
                        elementSaved.air++;
                    } else if (this.sElemet === "water"){
                        elementSaved.water++;
                    } else if (this.sElemet === "earth"){
                        elementSaved.earth++;
                    }
                }
                else ui.stability -= 50;
                this.markedForDeletion = true;
            };
            super.update(deltaTime);    
        }
        draw(){
            context.drawImage(this.image[0],this.frameX * this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height); 
        }
        fire(){
            ui.bullet--;
            game.gameObjects.push(new Laser(this.x - 5, this.y + this.height * 0.5, 10, 4, true));
            lasers.push(game.gameObjects[game.gameObjects.length - 1]);
        }
    }

    class Laser{
        constructor(x, y, width, height, flipDir){
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.color = "red";
            this.flipDir = flipDir || false;
            this.markedForDeletion = false;
            this.img = images[4];
        }
        update(deltaTime){
            const deltaScale = deltaTime / 100;
            if(!this.flipDir){
                this.x+= Math.floor(Math.random() * 4) + 4 * deltaScale;
            } else {
                this.x-= Math.floor(Math.random() * 4) + 4 * deltaScale;
            }
        }
        draw(){
            context.drawImage(this.img, this.x, this.y, this.width, this.height);
        }
    }

    class Input{
        constructor(){
            keypressed = [];
            window.addEventListener("keydown", (e) => {this.keyPress(e)}, false);
        }
        keyPress(e){
            if(e){
                keypressed.push(e.code);
            }
        }
        draw(){
            keypressed = [];
        }
    }
    
    class UI{
        constructor(health, maxHealth, stability, bullet, turboTime){
            this.health = health;
            this.maxHealth = maxHealth;
            this.stability = stability;
            this.bullet = bullet;
            this.maxBullet = bullet;
            this.turboTime = turboTime;
            this.slow = 0;
            this.slowTime = 5;
            this.score = 0;
        }
        update(deltaTime){
            if(this.health < 0 || this.stability < 0) gameOver();
            if(this.slow > this.slowTime){
                if(this.turboTime < this.maxHealth) this.turboTime+=0.5;
                else {
                    this.health += 20;
                    if(this.health > 100) this.health = 100;   
                    this.turboTime = 0;
                    this.stability+=100;
                }
                this.slow = 0;
            } else {
                this.slow+=deltaTime;
            }
          
        }
        draw(){
            context.fillStyle = "white"
            context.fillRect(20, 15, this.maxHealth * 1.6, 12);
            context.fillStyle = "red"; 
            context.fillRect(20, 15, this.health * 1.6, 12);
            context.fillStyle = "white"; 
            context.fillRect(190, 15, this.maxHealth * 1.6, 12);
            context.fillStyle = "teal";
            context.fillRect(190, 15, this.turboTime * 1.6, 12);
            context.beginPath();
            context.fillStyle = "rgba(120, 120, 120, 0.8)";
            context.strokeStyle = "pink";
            context.arc(0, 0, 35, - Math.PI * 0.5, Math.PI * 2);
            context.fill();
            context.stroke();
            context.fillStyle = "rgba(120, 120, 120, 1)";
            context.fillRect(0, 0, gameWidth, 10);
            context.closePath();
            context.fillStyle = "wheat";
            context.font = "22px Comic Sans MS Bold";
            context.textAlign = "left";
            context.textBaseline = "middle";
            context.fillText("Stability: " + this.stability, 20, 40);
            context.font = "30px Comic Sans MS"
            context.fillText("Score: " + this.score, gameWidth * 0.8, gameHeight * 0.1);
            context.fillStyle = "gray"
            context.fillText("Score: " + this.score, gameWidth * 0.8 + 2, gameHeight * 0.1 + 2);
            context.font = "22px Comic Sans MS Bold";
            context.fillText("Stability: " + this.stability, 20 + 1, 40+1);
            for(let i = 0; i < this.maxBullet; i++){
                context.fillStyle = "gray"; 
                context.fillRect(20 + i * 4, 56, 2, 15);
                context.fillStyle = "red"; 
                context.fillRect(20 + i * 4, 71, 2, 4);
            }
            
            for(let i = 0; i < this.bullet; i++){
                context.fillStyle = "white"; 
                context.fillRect(20 + i * 4, 56, 2, 15);
            }
        }
    }

    const input = new Input();
    const player = new Player(-10, 10, 32, 32);
    const element = new Element( gameWidth * 0.5, -10, 32, 32);
    const ui = new UI(100, 100, 500, 40, 0);
    const game = new Game(0, [input, player, element, ui]);
    console.log(game.gameObjects)

    let animateR;

    let check = 0;
    let maxCheck = 400;
    lastTime = 0;
    function animate(time){
        const deltaTime = time - lastTime;
        lastTime = time;
        game.update(deltaTime);
        context.drawImage(images[3], 0, 0, gameWidth, gameHeight);
        game.draw();
        check+=deltaTime / 100;
        game.filter();
        input.draw();
        if(check > maxCheck) {
            if(check > 600){
                check = 0;
            }
            
            if(check !== 0) {
                check = 0;
                if(maxCheck > 40) maxCheck -= 20;
                game.gameObjects.push(new Element( gameWidth * 0.5, -10, 32, 32));
            }
        }
        animateR = requestAnimationFrame(animate);
        if(document.getElementById("gameOver").style.display === "block") {
            cancelAnimationFrame(animateR);
            game.gameObjects = [];
        }
    }

    function checkCollision(a, b){
        return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    }

    animate(0);

    function gameOver(){
        document.getElementById("gameOver").style.display = "block";
    }
}

function play(){
    start();
}