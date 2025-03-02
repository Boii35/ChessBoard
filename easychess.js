const chessBoard = document.getElementById("chessboard") //lay phan tu tu id chessBoard
let selectedPiece = null; //ban dau ko quan co nao duoc chon
let validMoves = []; //Mang luu giu nhung nuoc di hop le cua cac quan
//let selectedX = null, selectedY = null;
const board = [
    ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"], // Hàng 1 (đen)
    ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"], // Hàng 2 (đen)
    ["", "", "", "", "", "", "", ""],               // Hàng 3
    ["", "", "", "", "", "", "", ""],               // Hàng 4
    ["", "", "", "", "", "", "", ""],               // Hàng 5
    ["", "", "", "", "", "", "", ""],               // Hàng 6
    ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"], // Hàng 7 (trắng)
    ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"], // Hàng 8 (trắng)
];
// Ham ve ban co
function displayBoard(){
    // Xoa ban co
    chessBoard.innerHTML = "";
    // Ve ban co 
    for(let x = 0; x <8; x++){
        for(let y = 0; y < 8; y++){
            const square = document.createElement('div');
            square.classList.add('square');
            if((x+y)%2==0)  {
                square.classList.add('white')
            }
            else {
                square.classList.add('black')
            }
            // Gan quan co cho o vuong 
            square.innerText = board[x][y];
            // Luu du lieu x y vao dataset
            square.dataset.x = x;
            square.dataset.y = y;
            // some kiem tra xem mang co thoa dieu kien ( [x] = x, [y] = y) hay khong
            if (validMoves.some(move => move[0] == x && move[1] == y)) {
                // Hien thi mau khi huong di chuyen hop le
                square.classList.add("highlight");
            }
            // Khi click vao o se thuc hien ham pressSquare 
            square.addEventListener('click', pressSquare);
            // Hien thi square tren ban co chessBoard
            chessBoard.appendChild(square);
        }
    }

}
// Goi ham thuc hien 
displayBoard();

// Ham xu ly khi nhan vao o -- truyen tham so event 
function pressSquare(event){
    // Vi tri cua o co, cho minh biet la o co nao dang duoc chon
    const x = parseInt(event.target.dataset.x);
    const y = parseInt(event.target.dataset.y);

    if (selectedPiece) {
        if (validMoves.some(move => move[0] == x && move[1] == y)) {
            // Di chuyen quan co toi vi tri moi
            board[x][y] = selectedPiece.piece;
            // Xoa quan co o vi tri cu 
            board[selectedPiece.x][selectedPiece.y] = "";
            // Tra lai chua chon quan nao
            selectedPiece = null;
            // Xoa nuoc di hop le cua quan do trong mang 
            validMoves = [];
            // Cap nhat lai ban co 
            displayBoard(); 
            return;
        }
    }
    // Neu ban co co quan 
    if (board[x][y] !== "") {
        // Luu vi tri x y va quan co cho bien selectedPiece
        selectedPiece = { x, y, piece: board[x][y] };
        // Goi ham getValidMoves, sau do gan gia tri cua quan co (vi tri, loai quan) sau go gan cho mang validMoves
        validMoves = getValidMoves(selectedPiece.x, selectedPiece.y, selectedPiece.piece);
    } else {
        // De huy chon quan do di chuyen, click vao o trong de huy 
        // Tra ve chua chon quan nao
        selectedPiece = null;
        // Xoa cac nuoc di hop le cua mang
        validMoves = [];
    }

    displayBoard();
}

// Ham xu ly di chuyen quan 
function getValidMoves(x, y, piece) {
    const moves = [];
    // Quân xe
    if (piece == "♜" || piece == "♖") {
        for( let i = x + 1; i < 8; i++){
            if (board[i][y] != "") {break;}
            else {
                moves.push([i,y]);
            }
        }
        for( let i = x-1; i >=0; i--){
            if (board[i][y] != "") {break;}
            else {
                moves.push([i,y]);
            }
        }
        for ( let i = y + 1; i < 8; i++){
            if (board[x][i] != "") {break;}
            else {
                
                moves.push([x, i]);
            }  
        }
        for ( let i = y-1; i < 8; i++){
            if (board[x][i] != "") {break;}
            else {
                moves.push([x,i]);
            }
        }
    }
    // Quân mã
    else if (piece == "♞" || piece == "♘") {
        const horse = [[2,1], [2,-1], [-2,1], [-2,-1], [1,-2], [-1,-2], [1,2], [-1,2]];
        for ( const [hx,hy] of horse){
            const nx = x + hx, ny = y + hy;
            if (nx >=0 && nx < 8 && ny >=0 && ny < 8 && board[nx][ny] == "") 
                {moves.push([nx,ny])};
        }
    }
        /*for ( let i = x; i < 8; i++){
            if (board[i+2][y+1] != "") {break;}
            else {moves.push([i+2,y+1])}    
            break;
        }
        for ( let i = x; i < 8; i++){
            if (board[i+2][y-1] != "") {break;}
            else {moves.push([i+2,y+1])}
            break;
        }
        for ( let i = x; i < 8; i++){
            if (board[i-2][y+1] != "") {break;}
            else {moves.push([i-2,y+1])}
            break;
        }
        for ( let i = x; i < 8; i++){
            if (board[i-2][y-1] != "") {break;}
            else {moves.push([i-2,y-1])}
            break;
        }
        for ( let i = y; i < 8; i++){
            if (board[x+1][i-2] != "") {break;}
            else {moves.push([x+1,i-2])}
            break;
        }
        for ( let i = y; i < 8; i++){
            if (board[x-1][y-2] != "") {break;}
            else {moves.push([x-1,i-2])}
            break;
        }
        for ( let i = y; i < 8; i++){
            if (board[x+1][y+2] != "") {break;}
            else {moves.push([x+1,i+2])}
            break;
        }
        for ( let i = y; i < 8; i++){
            if (board[x-1][y+2] != "") {break;}
            else {moves.push([x-1,i+2])}
            break;
        }*/
        // Quan tuong        
        else if ( piece == "♝" || piece == "♗"){
            for ( let i = 1; i < 8; i++){
                if ( x + i < 8 && y + i < 8 ){
                    if ( board[x+i][y+i] != "") {break;}
                    else {
                    moves.push([x+i,y+i]);
                    }
                }
            }
            for ( let i = 1; i < 8; i++){
                if ( x + i < 8 && y - i >= 0){
                    if (board[x+i][y-i] != "") {break;}
                    else {
                        moves.push([x+i,y-i]);
                    }
                }
            }
            for( let i = 1; i < 8; i++){
                if ( x - i >= 0 && y + i < 8) {
                    if (board[x-i][y+i] != "") {break;}
                    else {
                        moves.push([x-i,y+i]);
                    }
                }
            }
            for ( let i = 1; i < 8; i++){
                if ( x - i >= 0 && y - i >= 0) {
                    if (board[x-i][y-i] != "") {break;}
                    else {
                        moves.push([x-i,y-i]);
                    }
                }
            }   
        }
        // Quan hau 
        else if ( piece == "♛" || piece == "♕"){
            moves.push(...getValidMoves(x, y, "♜"))
            moves.push(...getValidMoves(x, y, "♝"))
        }
        // Quan vua
        else if ( piece == "♚" || piece == "♔"){
            const king = [[1,0],[-1,0],[0,-1],[0,1],[1,-1],[1,1],[-1,-1],[-1,1]]
            for ( const [kx,ky] of king){
                const hx = x + kx, hy = y + ky;
                if ( hx >=0 && hx < 8 && hy >=0 && hy < 8 && board[hx][hy] == "")  {
                    moves.push([hx,hy]);
                }
            }
        } 
        // Quan tot den
        else if (piece == "♟"){
            if(x+1 < 8){
                if ( board[x+1][y] != "") {}
                else {moves.push([x+1,y])};
            }
        }
        // Quan tot trang
        else if (piece == "♙"){
            if (x-1>=0){
                if ( board[x-1][y] != "") {}
                else {moves.push([x-1,y])};
            }
        }

        return moves;
}


  

/*function getValidMoves(){
    for(let x=0; x<8;x++){

    }
    
}
function getValidMoves(){
    const validMoves = [];
    for (let i=x; i<8; i++) {
        if (board[i+1][y] != "") {
            break;
        } else {
            validMoves.push([i+1, y])
        }
    }
    for (let i=y; i<8; i++) {
        if (board[x][i+1] != "") {
            break;
        } else {
            validMoves.push([x, y+1])
        }
    }
    return validMoves;

}



































/*function displayBoard(){
    chessBoard.innerHTML = "";
    for(let x = 0; x < 8; x++){
        for(let y = 0; y < 8; y++){
            const square = document.createElement("div");
            square.classList.add("square");
            if((x+y)%2==0){
                square.classList.add("white")
            }
            else {
                square.classList.add("black")
            }
            square.innerText = board[x][y];
            square.dataset.x = x;
            square.dataset.y = y;
            square.addEventListener("click", handleBoard);
            chessBoard.appendChild(square);
        }
    }
}

function handleBoard(event){
    let x = event.target.dataset.x;
    let y = event.target.dataset.y;
    if(!selectedPiece && board[x][y] !== ""){
        selectedPiece = {x, y, piece: board[x][y]};
        event.target.classList.add("selected");
    }
    else if(selectedPiece){
        board[selectedPiece.x][selectedPiece.y] = "";
        board[x][y] = selectedPiece.piece;
        selectedPiece = null;
        displayBoard();
    }
}

displayBoard();
function getValidMoves(){
    const validMoves = [];
    for (let i=x; i<8; i++) {
        if (board[i+1][y] != "") {
            break;
        } else {
            validMoves.push([i+1, y])
        }
    }
    for (let i=y; i<8; i++) {
        if (board[x][i+1] != "") {
            break;
        } else {
            validMoves.push([x, y+1])
        }
    }
    return validMoves;

}

const moves = getValidMoves(board, 0, 0, 'w', 'xe');

console.log(moves);*/
