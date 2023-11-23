let board = [];
let Width = 5;
let Height = 5;
let Bombs = 5;
let firstClick = true;
let GameOver = false;
let tilesClicked = 0;
let isSettingsShowing = false;

// determines how large the open area is upon first click
// "3" represents a 3x3 box, e.g. 7 would represent a 7x7 box
const widthOfOpenSpace = 3;

const COLORS = ["blue","green","red","darkblue","brown","cyan","black","grey"];

// Cover Colors
//     ->  Lighter, Darker
// Open Colors
//     ->  Lighter, Darker
const TILE_COLORS = ["#a4ffa4","#61fd6d","white","aliceblue"];

// possible mine colors
const MINE_COLORS = [0,360,  90,100   ,50,70];

// flag colors
const FLAG_COLORS = ["#ffff00", "#000000"];

// mine color
const MINE_COLOR = ["#000000"];

//border surrounding open tiles
const TILE_BORDER_SIZE = "3";
const TILE_BORDER_COLOR = "black";

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
        this.clicked = false;
        this.flag = false;
        this.element = element;
        this.openColor = null;
        this.closedColor = null;
    }

    clear(){
        if( this.flag || this.clicked) return;

        this.clearDOMTile();

        if( this.bomb ){
            GameOver = true;
            gameLost();
        } else {
            this.clicked = true;
            tilesClicked++;

            if( this.number == 0) this.clearZeroes();
        }
    }

    clearDOMTile(){
        if( this.bomb ){
            this.element.style.backgroundColor = "#f8484d";
        } else {
            this.element.style.backgroundColor = this.openColor;
            this.element.style.color = COLORS[this.number-1];
            if( this.number != 0){
                this.element.textContent = this.number;
            }
        }
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
        this.flag = !this.flag;

        if( this.flag ){
           this.element.style.backgroundColor = FLAG_COLORS[0];
           this.element.innerHTML = "<div class='triangle-left'></div>";
           this.element.firstChild.style.borderRight = `24px solid ${FLAG_COLORS[1]}`;

        } else {
            this.element.style.backgroundColor = this.closedColor;
            this.element.innerHTML = "";
        }
    }

    middleClick(){
        if( !this.clicked ) return;
        //
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

GAMES = {
    "Easy": {
        "Width": 9,
        "Height": 9,
        "Mines": 10,
    },
    "Moderate": {
        "Width": 16,
        "Height": 16,
        "Mines": 40
    },
    "Severe": {
        "Width": 30,
        "Height": 16,
        "Mines": 99
    },
    "Chaos": {
        "Width": 30,
        "Height": 20,
        "Mines": 145,
    }
}

const customWidthBox = document.querySelector("#custom-width");
const customHeightBox = document.querySelector("#custom-height");
const customMinesBox = document.querySelector("#custom-mines");

function getGameModeSelected(){
    let temp;
    gameButtons.forEach( button => {
        if( button.checked){
           temp = button.value;
        }
    })
    return temp;
}

function createBoard(w = 0,h = 0,b = 0){
    const gameModeSelected = getGameModeSelected();

    if( gameModeSelected == "Custom"){
        Width = parseInt(customWidthBox.value);
        Height = parseInt(customHeightBox.value);
        Mines = parseInt(customMinesBox.value);
    } else if( gameModeSelected != "Custom"){
        Width = GAMES[gameModeSelected]["Width"];
        Height = GAMES[gameModeSelected]["Height"];
        Bombs = GAMES[gameModeSelected]["Mines"];
    } else {
        Width = w;
        Height = h;
        Bombs = b;
    }

    // type checking
    if( typeof(Width) === "string" || typeof(Height) === "string" || typeof(Bombs) == "string"){
        console.warn("Arguments must be integers!");
        return
    }

    // integer checking
    Width = Math.max(1, Math.round(Width));
    Height = Math.max(1, Math.round(Height));
    Bombs = Math.max( 0,  Math.min( Math.round(Bombs), Width * Height - 9));

    firstClick = true;
    GameOver = false;
    tilesClicked = 0;

    // create html elements
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
            
            element.style.backgroundColor = TILE_COLORS[ (i + j)%2 ];
            board[j][i].openColor = TILE_COLORS[ (i+j) % 2 + 2];
            board[j][i].closedColor =  TILE_COLORS[ (i + j)%2 ];

            fragment.appendChild(element);
        }
        document.querySelector(".board").appendChild( fragment );
    } 

    // add adjacent tiles property to each tile 
    board.forEach( column => {
        column.forEach( tile => {
            tile.adjTiles = tile.getAdjTiles();
        });
    });
}

const gameButtons = document.querySelectorAll("input[name='game']");

//intizliae to severe being default
gameButtons[2].checked = true;



function createBombsAndNumbers(x,y){
    let bombsLeft = Bombs;
    while( bombsLeft > 0){
        const randomX = Math.floor(Math.random() * Width);
        const randomY = Math.floor(Math.random() * Height);
        const tile = board[randomX][randomY];

        // returns true if bomb is directly adjacent to first click
        const adjacentToClick = (Math.abs(tile.x-x) + Math.abs(tile.y-y)) < widthOfOpenSpace;

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
                    tile.element.innerHTML = "<div class='mine'></div>"
                    tile.element.style.backgroundColor = randomColor();
                    tile.element.firstChild.style.backgroundColor = MINE_COLOR[0];
                } else {
                    tile.element.style.backgroundColor = "yellow";
                }
            } else if(tile.flag){
                tile.element.style.backgroundColor = "#f8484d";
            }
        });
    });
    alert("You have lost")
}
createBoard(30,16,99);



function rand(min, max) {
    return parseInt(Math.random() * (max-min+1), 10) + min;
}

function randomColor() {
    var h = rand(MINE_COLORS[0], MINE_COLORS[1]);
    var s = rand(MINE_COLORS[2], MINE_COLORS[3]);
    var l = rand(MINE_COLORS[4], MINE_COLORS[5]);
    return `hsl(${h},${s}%,${l}%)`;
}



const settingsButton = document.querySelector(".settings");
const settingsMenu = document.querySelector(".settings-menu");
const closeModal = document.querySelector("#close-modal");
const resetModal = document.querySelector("#reset-modal");
const submitModal = document.querySelector("#submit-modal");

const primaryClosed = document.querySelector("#dark-closed");
const secondaryClosed = document.querySelector("#light-closed");
const primaryOpen = document.querySelector("#dark-open");
const secondaryOpen = document.querySelector("#light-open");

const minHue = document.querySelector("#min-hue");
const maxHue = document.querySelector("#max-hue");
const minSat = document.querySelector("#min-sat");
const maxSat = document.querySelector("#max-sat");
const minLig = document.querySelector("#min-lig");
const maxLig = document.querySelector("#max-lig");
const mineColor = document.querySelector("#mine-color");

const flagBgcolor = document.querySelector("#flag-bgcolor");
const flagColor = document.querySelector("#flag-color");

function resetTileColors(){
    for( i = 0; i < Height; i++){ 
        for(j = 0; j < Width; j++){ 
          
            if( board[j][i].clicked ){
                board[j][i].element.style.backgroundColor = TILE_COLORS[ (i + j)%2 + 2 ];
            } else if( !(board[j][i].flag || (board[j][i].bomb && !board[j][i].clicked))){
                board[j][i].element.style.backgroundColor = TILE_COLORS[ (i + j)%2 ];
            }
            board[j][i].openColor = TILE_COLORS[ (i+j) % 2 + 2];
            board[j][i].closedColor =  TILE_COLORS[ (i + j)%2 ];
        }
    }
}

settingsButton.addEventListener("click", () => {
    settingsMenu.showModal()
});

closeModal.addEventListener("click", () => {
    settingsMenu.close();
})

resetModal.addEventListener("click", () => {
    primaryClosed.value = "#a4ffa4";
    secondaryClosed.value = "#61fd6d";
    primaryOpen.value = "#ffffff";
    secondaryOpen.value = "#F0F8FF";

    minHue.value = "0";
    maxHue.value = "360";
    minSat.value = "90";
    maxSat.value = "100";
    minLig.value = "50";
    maxLig.value = "70";
    
    mineColor.value = "#000000";

    flagBgcolor.value = "#ffff00";
    flagColor.value = "#000000";
})


let colorChange = false;


submitModal.addEventListener("click", () => {
    settingsMenu.close();
    TILE_COLORS[0] = primaryClosed.value;
    TILE_COLORS[1] = secondaryClosed.value;
    TILE_COLORS[2] = primaryOpen.value;
    TILE_COLORS[3] = secondaryOpen.value;

    MINE_COLORS[0] = parseInt(minHue.value);
    MINE_COLORS[1] = parseInt(maxHue.value);
    MINE_COLORS[2] = parseInt(minSat.value);
    MINE_COLORS[3] = parseInt(maxSat.value);
    MINE_COLORS[4] = parseInt(minLig.value);
    MINE_COLORS[5] = parseInt(maxLig.value);
    MINE_COLOR[0] = mineColor.value;

    FLAG_COLORS[0] = flagBgcolor.value;
    FLAG_COLORS[1] = flagColor.value;

    resetTileColors();
});
