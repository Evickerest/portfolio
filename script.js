let board = [];
let Width = 5;
let Height = 5;
let Bombs = 5;
let firstClick = true;
let GameOver = false;
let tilesClicked = 0;

const COLORS = ["blue","green","red","darkblue","brown","cyan","black","grey"];

// prevents right click and middle click on document
document.addEventListener('contextmenu', event => event.preventDefault());
document.body.onmousedown = function(e) { if (e.button === 1) return false; }

isValidTile = (x,y) => !(x < 0 || x >= Width || y < 0 || y >= Height);

class Tile {
    constructor(x,y,element){
        this.x = x;
        this.y = y;
        this.bomb = false;
        this.number = 0;
        this.cleared = false;
        this.clicked = false;
        this.flag = false;
        this.element = element;
    }

    clear(){
        if( this.flag || this.clicked) return;

        this.element.style.backgroundColor = "white";

        let content = '';

        if(this.bomb){
            this.element.style.backgroundColor = "#f8484d";
            content = "\u{1F4A3}";
            GameOver = true;
            gameLost();
        } else if( this.number != 0){
            content = this.number;
        } 

        this.element.textContent = content;
    
        this.element.style.color = COLORS[this.number-1];
        this.clicked = true;

        tilesClicked++;

        if( this.number == 0) this.clearZeroes(); 
    }

    getAdjTiles(){
        let tile = [];
        for(i = -1; i <= 1; i++){ 
            for(j = -1; j <= 1; j++){
                if( isValidTile(this.x+i,this.y+j) && !(i == 0 && j == 0)){
                    tile.push(board[this.x+i][this.y+j]);
                } 
            }
        }
        return tile;
    }   

    flagTile(){  
        if( this.clicked ) return;
        this.element.textContent = this.flag ? "" : "\u{1F6A9}";
        this.flag = !this.flag;
    }

    middleClick(){
        if( !this.clicked ) return;
        const numOfAdjFlags = this.adjTiles.reduce((sum,tile) => sum+tile.flag, 0);
        if( this.number == numOfAdjFlags ){
            this.clearAdjTiles();
        }
    }

    clearAdjTiles(){
        this.adjTiles.forEach( adjTile => adjTile.clear());
    }

    clearZeroes(){
        if( this.number != 0 || this.flag || this.bomb ) return
        this.clearAdjTiles();
    }
}

function createBoard(w,h,b){
    Width = w;
    Height = h;
    Bombs = b;
    firstClick = true;
    GameOver = false;
    tilesClicked = 0;

    document.querySelector(".board").textContent = "";
    const fragment = new DocumentFragment();
    
    document.documentElement.style.setProperty('--grid-width', Width);

    board = Array(Width).fill(0).map(x => Array(Height).fill(0));

    for( i = 0; i < Height; i++){ for(j = 0; j < Width; j++){  
            const element = document.createElement("div");
            element.className = "tile";
            element.onmouseup = click;
            board[j][i] = new Tile(j,i,element);
            element.tile = board[j][i];
            fragment.appendChild(element);
        }
        document.querySelector(".board").appendChild( fragment );
    } 

    board.forEach( column => {
        column.forEach( tile => {
            tile.adjTiles = tile.getAdjTiles();
        });
    });
}

function createBombsAndNumbers(x,y){
    let bombsLeft = Bombs;
    while( bombsLeft > 0){
        const randomX = Math.floor(Math.random() * Width);
        const randomY = Math.floor(Math.random() * Height);
        const tile = board[randomX][randomY];

        // returns true if bomb is directly adjacent to first click
        const adjacentToClick = (Math.abs(tile.x-x) + Math.abs(tile.y-y)) < 3

        if( tile.bomb || adjacentToClick) continue;

        tile.bomb = true;
        tile.adjTiles.forEach(adjTile => {
            adjTile.number++
        });
        bombsLeft--;   
    }
}

function click(e){
    if(GameOver) return;

    if( e.which == 1){
        if(firstClick){
            createBombsAndNumbers(this.tile.x,this.tile.y);
            firstClick = false;
        }
        this.tile.clear();  

    } else if( e.which == 2){
        this.tile.middleClick();

    } else if( e.which == 3){
        this.tile.flagTile();
    } 
    checkWin();
}

function checkWin(){
    if( tilesClicked != Width*Height - Bombs) return;
    GameOver = true;
    board.forEach(column => {
        column.forEach( tile => {
            if( tile.bomb && !tile.flag) tile.flagTile();
        });
    });
    alert("You have won")
}

function gameLost(){
    board.forEach(column => {
        column.forEach( tile => {
            if( tile.bomb){
            if( !tile.flag){
                tile.element.textContent = "\u{1F4A3}";
            } else {
                tile.element.style.backgroundColor = "yellow";
            }
        }
        });
    });
    alert("You have lost")
}

createBoard(9,9,10);
