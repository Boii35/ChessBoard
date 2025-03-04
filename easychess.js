const chessBoard = document.getElementById("chessboard") //lay phan tu tu id chessBoard
let selectedPiece = null; //ban dau ko quan co nao duoc chon
let validMoves = []; //Mang luu giu nhung nuoc di hop le cua cac quan
let piecesBlack = ["♜", "♞", "♝", "♛", "♚","♟"];
let piecesWhite = ["♖", "♘", "♗", "♕", "♔","♙"];
let currentTurn = "white";
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
                if (board[x][y] !=""){
                    square.classList.add("highlightpiece");
                }
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

// Ham kiem tra mau quan 
function pieceWhite(piece){
    return piecesWhite.includes(piece);
}
function pieceBlack(piece){
    return piecesBlack.includes(piece);
}

// Ham xu ly khi nhan vao o -- truyen tham so event 
function pressSquare(event){
    
    // Vi tri cua o co, cho minh biet la o co nao dang duoc chon
    const x = parseInt(event.target.dataset.x);
    const y = parseInt(event.target.dataset.y);
    
    if (selectedPiece) {
        // Kiem tra o muon di co nam trong mang chua nuoc di hop le cua quan do khong
        if (validMoves.some(move => move[0] == x && move[1] == y)) {
            // O di chuyen cuoi cung
            lastDance = {x,y};
            // Di chuyen quan co toi vi tri moi
            board[x][y] = selectedPiece.piece;
            // Xoa quan co o vi tri cu 
            board[selectedPiece.x][selectedPiece.y] = "";
            // Tra lai chua chon quan nao
            selectedPiece = null;
            // Xoa nuoc di hop le cua quan do trong mang 
            validMoves = [];
            //Doi luot luan phien
            if (currentTurn == "white"){
                currentTurn = "black";
            }
            else {
                currentTurn = "white";
            }
            // Cap nhat lai ban co 
            displayBoard(); 
            return;
    }
    }
    // Neu ban co co quan 
    let piece = board[x][y];
    // Kiem tra ban co co quan hay khong 
    if (board[x][y] !== "") {
        // Kiem tra mau quan theo luot choi
        if ((pieceWhite(piece) && currentTurn == "white") || (pieceBlack(piece) && currentTurn =="black")){
        // Luu vi tri x y va quan co cho bien selectedPiece
        selectedPiece = { x, y, piece: board[x][y] };
        // Goi ham getValidMoves, sau do gan gia tri cua quan co (vi tri, loai quan) sau go gan cho mang validMoves
        validMoves = getValidMoves(selectedPiece.x, selectedPiece.y, selectedPiece.piece);
    }
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
            if (board[i][y] != "") {
                //Quan den va quan trang --- Quan trang va quan den
                if ((pieceBlack(piece) && pieceWhite(board[i][y])) || (pieceWhite(piece) && pieceBlack(board[i][y]))){
                    moves.push([i,y]);
                    }
                    break; 
                }
            else {
                moves.push([i,y]);
            }
        }
        for( let i = x-1; i >=0; i--){
            if (board[i][y] != "") {
                if ((pieceBlack(piece) && pieceWhite(board[i][y])) || (pieceWhite(piece) && pieceBlack(board[i][y]))){
                    moves.push([i,y]);
                    }
                    break; 
                }
            else {
                moves.push([i,y]);
            }
        }
        for ( let i = y + 1; i < 8; i++){
            if (board[x][i] != "") {
                if ((pieceWhite(piece) && pieceBlack(board[x][i])) || (pieceBlack(piece) && pieceWhite(board[x][i]))){
                    moves.push([x,i]);
                }
                break;
                }
            else {
                moves.push([x, i]);
            }  
        }
        for ( let i = y-1; i >= 0; i--){
            if (board[x][i] != "") {
                if ((pieceWhite(piece) && pieceBlack(board[x][i])) || (pieceBlack(piece) && pieceWhite(board[x][i]))){
                  moves.push([x,i]);  
                }
                break;
            }
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
            if (nx >=0 && nx < 8 && ny >=0 && ny < 8){
                if (board[nx][ny] == "") {
                moves.push([nx,ny]);
            }
                else {
                    if ((pieceBlack(piece) && pieceWhite(board[nx][ny])) || (pieceWhite(piece) && pieceBlack(board[nx][ny]))){
                        moves.push([nx,ny]);
                    }
                }
        }
    }
}

        // Quan tuong        
        else if ( piece == "♝" || piece == "♗"){
            for ( let i = 1; i < 8; i++){
                if ( x + i < 8 && y + i < 8 ){
                    if ( board[x+i][y+i] != "") {
                        if((pieceBlack(piece) && pieceWhite(board[x+i][y+i])) || (pieceWhite(piece) && pieceBlack(board[x+i][y+i]))){
                            moves.push([x+i,y+i]);
                        }
                        break;
                    }
                    else {
                    moves.push([x+i,y+i]);
                    }
                }
            }
            for ( let i = 1; i < 8; i++){
                if ( x + i < 8 && y - i >= 0){
                    if (board[x+i][y-i] != "") {
                        if((pieceBlack(piece) && pieceWhite(board[x+i][y-i])) || (pieceWhite(piece)&& pieceBlack(board[x+i][y-i]))){
                            moves.push([x+i,y-i]);
                        }
                        break;
                    }
                    else {
                        moves.push([x+i,y-i]);
                    }
                }
            }
            for( let i = 1; i < 8; i++){
                if ( x - i >= 0 && y + i < 8) {
                    if (board[x-i][y+i] != "") {
                        if ((pieceBlack(piece) && pieceWhite(board[x-i][y+i])) || (pieceWhite(piece)&& pieceBlack(board[x-i][y+i]))){
                            moves.push([x-i,y+i]);
                        }
                        break;
                    }
                    else {
                        moves.push([x-i,y+i]);
                    }
                }
            }
            for ( let i = 1; i < 8; i++){
                if ( x - i >= 0 && y - i >= 0) {
                    if (board[x-i][y-i] != "") {
                        if((pieceWhite(piece)&& pieceBlack(board[x-i][y-i])) || (pieceBlack(piece) && pieceWhite(board[x-i][y-i]))){
                            moves.push([x-i,y-i]);
                        }
                        break;
                    }
                    else {
                        moves.push([x-i,y-i]);
                    }
                }
            }   
        }
        // Quan hau 
        else if ( piece == "♛" ){
            moves.push(...getValidMoves(x, y, "♜"))
            moves.push(...getValidMoves(x, y, "♝"))
        }
        else if ( piece == "♕"){
            moves.push(...getValidMoves(x, y, "♖"))
            moves.push(...getValidMoves(x, y, "♗"))
        }
        // Quan vua
        else if ( piece == "♚" || piece == "♔"){
            const king = [[1,0],[-1,0],[0,-1],[0,1],[1,-1],[1,1],[-1,-1],[-1,1]]
            for ( const [kx,ky] of king){
                const hx = x + kx, hy = y + ky;
                if ( hx >=0 && hx < 8 && hy >=0 && hy < 8 ){
                    if (board[hx][hy] == "")  {
                    moves.push([hx,hy]);
                }
                else {
                    if((pieceWhite(piece)&& pieceBlack(board[hx][hy])) || (pieceBlack(piece) && pieceWhite(board[hx][hy]))){
                        moves.push([hx,hy]);
                    }
                }
            }
            }
        } 
        // Quan tot den
        else if (piece == "♟"){
            if( x+1 < 8){
                if ( board[x+1][y] != "") {
                    if(pieceBlack(piece) && pieceWhite(board[x+1][y])){}}
                if ( board[x+1][y+1] != ""){   
                    if(pieceBlack(piece) && pieceWhite(board[x+1][y+1])){
                        moves.push([x+1,y+1]);
                    }
                } 
                if ( board[x+1][y-1] != ""){  
                    if(pieceBlack(piece) && pieceWhite(board[x+1][y-1])){
                        moves.push([x+1,y-1]);
                    }
                }
                else {
                    moves.push([x+1,y]);
                }
            }
        }
        // Quan tot trang
        else if (piece == "♙"){
            if (x-1>=0){
                if ( board[x-1][y] != "") {
                    if(pieceWhite(piece) && pieceBlack(board[x-1][y])){}
                }
                if ( board[x-1][y-1] != ""){
                    if(pieceWhite(piece) && pieceBlack(board[x-1][y-1])){
                        moves.push([x-1,y-1]);  
                    }
                }
                if ( board[x-1][y+1] != ""){
                    if(pieceWhite(piece) && pieceBlack(board[x-1][y+1])){
                        moves.push([x-1,y+1]);
                    }
                }
                else {
                    moves.push([x-1,y]);
                };
            }
        }
        return moves;
}


  


