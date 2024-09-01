window.onload = () => {
    start();
}

const images = document.querySelectorAll("img");
const log = document.getElementById("log");
const enemy = document.getElementById("enemy");
const currentScore = document.getElementById("currentScore");
const highScore = document.getElementById("highScore");
const earth = document.getElementById("earth");
const air = document.getElementById("air");
const water = document.getElementById("water");
const fire = document.getElementById("fire");

function start(){
    const theme = document.getElementById("bg");
    theme.volume = 0.5;
    theme.play();
    theme.loop = true;
    theme.currentTime = 0;
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
                    this.updateGravity = -6;
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
                if(ui.bullet){
                log.currentTime = 0;
                log.volume = 0.2;
                log.play();
                this.fire()
                }
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
            game.gameObjects.push(new Laser(this.x + this.width, this.y + this.height * 0.8, 200, 4));
            lasers.push(game.gameObjects[game.gameObjects.length - 1]);
        }
    }

    class Element extends GameObject{
        constructor(x, y, width, height){
            super(2, 0.1, 2, 0 + 52, -100, gameWidth, gameHeight - height - 26);
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
            this.fireWaitTime = 50;
            this.fireTime = 0;
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
                this.x += 0.8 * deltaScale;
            }
            
            this.angle += 0.4;
            this.time += 3 * (deltaScale);
            if(this.time > this.waitTime) {
                this.start = true;
                if(this.waitTime > 60) this.waitTime -= 20;
                this.time = 0;
            }
            if(this.fireTime > this.fireWaitTime){
                this.fire();
                this.fireTime = 0;
            } else {
                this.fireTime += deltaScale;
            }
            lasers.forEach(laser => {
                if(checkCollision(laser, this)){
                    if(this.gravity < 0) return;
                    else if(this.y + this.height > laser.y + 12) return
                    this.y = laser.y - this.height;
                    this.gravity =   0;
                    this.updateGravity = 0;
                    for(let i = 0; i < 5; i++){
                        // if(randomVec4().r < 128){
                        //     game.gameObjects.push(new Particle(this.x + this.width * 0.5, this.y + this.height, Math.random() * 2 + 2, Math.floor(Math.random() + 2) + 1, "rectangle"));
                        // } else {
                            game.gameObjects.push(new Particle(this.x + this.width * 0.5, this.y + this.height, Math.random() * 2 + 2, Math.floor(Math.random() * 2) + 1, "circle"));
                        //}
                    }
                    if(this.x < laser.x + 10) this.jump = true, enemy.currentTime = 0, enemy.play(); 
                } else {
                    this.updateGravity = 0.5;
                }
            }); 
            if(this.jump){ 
                if(this.gravity >= 0) {
                    this.gravity = -10; 
                    this.updateGravity = -15;
                }
                this.jump = false;
            }
            if(this.y == this.maxY2){
                if(this.x + this.width > gameWidth * 0.8) {
                    ui.score+=200;
                    ui.health = ui.maxHealth;
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
                else ui.stability -= 50, ui.health -= 20;
                this.markedForDeletion = true;
            };
            super.update(deltaTime);
        }
        draw(){
            context.drawImage(this.image[0],this.frameX * this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height); 
        }
        fire(){
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
            this.velocityX = Math.floor(Math.random() * 4) + 4;
        }
        update(deltaTime){
            const deltaScale = deltaTime / 100;
            if(!this.flipDir){
                this.x+= this.velocityX * deltaScale;
            } else {
                this.x-=this.velocityX * deltaScale;
            }
            this.velocityX+=0.1;
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
            this.bulletTime = 0;
            this.bulletAdd = 5000;
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
            if(this.bulletTime > this.bulletAdd){
                this.bullet+=3;
                this.bulletTime = 0;
                if(this.bulletAdd > 2000)this.bulletAdd-=50;
            } else this.bulletTime+=deltaTime;
            if(this.bullet > this.maxBullet) this.bullet = this.maxBullet;
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
            context.font = "24px Comic Sans MS Bold";
            context.textAlign = "left";
            context.textBaseline = "middle";
            context.fillText("Stability: " + this.stability, 20, 40);
            context.font = "30px Comic Sans MS"
            context.fillText("Score: " + this.score, gameWidth * 0.7, gameHeight * 0.1);
            context.fillStyle = "gray"
            context.fillText("Score: " + this.score, gameWidth * 0.7 + 2, gameHeight * 0.1 + 2);
            context.font = "24px Comic Sans MS Bold";
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
            context.fillStyle = "tomato";
            context.fillRect(gameWidth *  0.8, gameHeight - 26, gameWidth * 0.2, 26);
        }
    }

    class Particle{
        constructor(x, y, radius, scale, type){
            this.x = x;
            this.y = y;
            this.scale = scale;
            this.radius = radius;
            this.type = type;
            this.markedForDeletion = false;
            this.vx = Math.random() * (1 + 0.5) + -  0.5;
            this.vy = Math.random() * (1 + 0.5) + -  0.5;
            this.color = Math.floor(Math.random() * 360);
            this.opacity = 1;
        }
        update(){
            this.x+=this.vx;
            this.y+=this.vy;
            this.opacity -= 0.002;
            if(this.scale > 0.1) this.scale-=0.01
            if(this.opacity <= 0) this.markedForDeletion = true;
        }
        draw(){
            context.fillStyle = `hsla(${this.color}, 50%, 50%, ${this.opacity})`;
            context.strokeStyle = "rgba(0, 0, 0, 0)";
            if(this.type == "circle"){
                context.beginPath();
                context.arc(this.x, this.y, this.radius * this.scale, 0, Math.PI * 2);
                context.fill();
                context.closePath();
            } else if(this.type == "rectangle"){
                context.fillRect(this.x, this.y, this.radius * this.scale, this.radius * this.scale);
            }
        }
    }

    let input = new Input();
    let player = new Player(-100, 10, 32, 32);
    let element = new Element( 20, -50, 32, 32);
    let ui = new UI(100, 100, 500, 40, 0);
    let game = new Game(0, [input, element, ui, player]);
    
    let animateR;

    let check = 0;
    let maxCheck = 300;

    function animate(time = 0){
        const deltaTime = time - lastTime;
        lastTime = time;
        game.update(deltaTime);
        context.drawImage(images[3], 0, 0, gameWidth, gameHeight);
        game.draw();
        check+=deltaTime / 100;
        game.filter();
        input.draw();
        if(check > maxCheck) {
            if(check > maxCheck + 40) {
                check = 0;
                if(maxCheck > 40) maxCheck -= 20;
                game.gameObjects.push(new Element(20, -50, 32, 32));
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
        if(window.localStorage.getItem("elementsInvadersHighscore") < ui.score){
            window.localStorage.setItem("elementsInvadersHighscore", ui.score);
        }
        currentScore.textContent = ui.score;
        highScore.textContent = window.localStorage.getItem("elementsInvadersHighscore");
        earth.textContent = elementSaved.earth;
        fire.textContent = elementSaved.fire;
        water.textContent = elementSaved.water;
        air.textContent = elementSaved.air;
        document.getElementById("gameOver").style.display = "block";
    }

    function play(){
        theme.volume = 0.5;
        theme.play();
        theme.loop = true;
        theme.currentTime = 0;
        document.getElementById("replay").onclick = play;
        document.getElementById("gameOver").style.display = "none";
    
        keypressed = [];
        elementSaved.air, elementSaved.earth, elementSaved.fire, elementSaved.water = 0;
    
        lastTime = 0;
        lasers = [];
        input = new Input();
        player = new Player(-100, 10, 32, 32);
        element = new Element( gameWidth * 0.5, -10, 32, 32);
        ui = new UI(100, 100, 500, 40, 0);
        game = new Game(0, [input, element, ui, player]);
        check = 0;
        maxCheck = 300;

        animate(0);
    }

    function randomVec4(a){
        return {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256),
            a: a
        }
    }
}