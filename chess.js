const board = [
    ["♜", "", "", "♛", "♚", "♝", "♞", "♜"], // Hàng 1 (đen)
    ["", "♟", "♟", "♟", "♟", "♟", "♟", "♟"], // Hàng 2 (đen)
    ["", "", "", "", "", "", "", ""],               // Hàng 3
    ["", "", "", "", "", "", "", ""],               // Hàng 4
    ["", "♟", "", "", "", "", "", ""],               // Hàng 5
    ["♙", "", "", "", "", "", "", ""],               // Hàng 6
    ["", "♙", "♙", "♙", "♙", "♙", "♙", "♙"], // Hàng 7 (trắng)
    ["♖", "", "♗", "♕", "♔", "♗", "♘", "♖"], // Hàng 8 (trắng)
];
function getValidMoves(b, x, y, color, chessType){
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

console.log(moves);