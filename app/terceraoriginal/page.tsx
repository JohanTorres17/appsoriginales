"use client";

import React, { useEffect, useState } from "react";

type Board = number[][];

function emptyBoard(): Board {
  return Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => 0));
}

function cloneBoard(b: Board): Board {
  return b.map((r) => r.slice());
}

function addRandomTile(b: Board) {
  const empties: [number, number][] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (b[r][c] === 0) empties.push([r, c]);
  if (empties.length === 0) return b;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  b[r][c] = Math.random() < 0.1 ? 4 : 2;
  return b;
}

function transpose(b: Board): Board {
  const res = emptyBoard();
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) res[r][c] = b[c][r];
  return res;
}

function reverseRows(b: Board): Board {
  return b.map((r) => r.slice().reverse());
}

function slideAndMergeRow(row: number[]): { row: number[]; score: number; moved: boolean } {
  const compact = row.filter((n) => n !== 0);
  const merged: number[] = [];
  let score = 0;
  let i = 0;
  while (i < compact.length) {
    if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
      const val = compact[i] * 2;
      merged.push(val);
      score += val;
      i += 2;
    } else {
      merged.push(compact[i]);
      i += 1;
    }
  }
  while (merged.length < 4) merged.push(0);
  const moved = merged.some((v, idx) => v !== row[idx]);
  return { row: merged, score, moved };
}

function moveLeft(b: Board) {
  let moved = false;
  let score = 0;
  const next = emptyBoard();
  for (let r = 0; r < 4; r++) {
    const res = slideAndMergeRow(b[r]);
    next[r] = res.row;
    moved = moved || res.moved;
    score += res.score;
  }
  return { board: next, moved, score };
}

function moveRight(b: Board) {
  const reversed = reverseRows(b);
  const movedResult = moveLeft(reversed);
  return { board: reverseRows(movedResult.board), moved: movedResult.moved, score: movedResult.score };
}

function moveUp(b: Board) {
  const t = transpose(b);
  const r = moveLeft(t);
  return { board: transpose(r.board), moved: r.moved, score: r.score };
}

function moveDown(b: Board) {
  const t = transpose(b);
  const r = moveRight(t);
  return { board: transpose(r.board), moved: r.moved, score: r.score };
}

function boardsEqual(a: Board, b: Board) {
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (a[r][c] !== b[r][c]) return false;
  return true;
}

function hasMoves(b: Board) {
  // si alguna celda vacía
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (b[r][c] === 0) return true;
  // chequear merges posibles
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const v = b[r][c];
    if ((c < 3 && b[r][c + 1] === v) || (r < 3 && b[r + 1][c] === v)) return true;
  }
  return false;
}

export default function Game2048() {
  const [board, setBoard] = useState<Board>(() => {
    const b = addRandomTile(addRandomTile(emptyBoard()));
    return b;
  });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => 0);
  const [history, setHistory] = useState<{ board: Board; score: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key;
      if (key === "ArrowLeft" || key.toLowerCase() === "a") applyMove("left");
      if (key === "ArrowRight" || key.toLowerCase() === "d") applyMove("right");
      if (key === "ArrowUp" || key.toLowerCase() === "w") applyMove("up");
      if (key === "ArrowDown" || key.toLowerCase() === "s") applyMove("down");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [board, score, gameOver]);

  function pushHistory(b: Board, sc: number) {
    setHistory((h) => [...h, { board: cloneBoard(b), score: sc }].slice(-20));
  }

  function applyMove(dir: "left" | "right" | "up" | "down") {
    if (gameOver) return;
    let res;
    if (dir === "left") res = moveLeft(board);
    else if (dir === "right") res = moveRight(board);
    else if (dir === "up") res = moveUp(board);
    else res = moveDown(board);

    if (!res.moved) return;

    pushHistory(board, score);
    const newBoard = addRandomTile(cloneBoard(res.board));
    const newScore = score + res.score;
    setBoard(newBoard);
    setScore(newScore);
    setBest((b) => Math.max(b, newScore));
    if (!hasMoves(newBoard)) setGameOver(true);
  }

  function resetGame() {
    const b = addRandomTile(addRandomTile(emptyBoard()));
    setBoard(b);
    setScore(0);
    setGameOver(false);
    setHistory([]);
  }

  function undo() {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setBoard(cloneBoard(last.board));
      setScore(last.score);
      setGameOver(false);
      return h.slice(0, -1);
    });
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">2048 (TSX)</h2>
        <div className="flex gap-2">
          <div className="text-center">
            <div className="text-sm text-gray-600">Score</div>
            <div className="font-bold">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Best</div>
            <div className="font-bold">{best}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 bg-gray-300 p-3 rounded">
        {board.flat().map((n, idx) => (
          <div key={idx} className={`h-16 flex items-center justify-center rounded text-lg font-semibold ${n === 0 ? 'bg-gray-100' : 'bg-white'}`}>
            {n === 0 ? "" : n}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={() => applyMove("up")} className="px-3 py-2 border rounded">Arriba</button>
        <button onClick={() => applyMove("left")} className="px-3 py-2 border rounded">Izquierda</button>
        <button onClick={() => applyMove("right")} className="px-3 py-2 border rounded">Derecha</button>
        <button onClick={() => applyMove("down")} className="px-3 py-2 border rounded">Abajo</button>
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={resetGame} className="px-3 py-2 border rounded">Reset</button>
        <button onClick={undo} className="px-3 py-2 border rounded" disabled={history.length === 0}>Undo</button>
      </div>

      {gameOver && <div className="mt-3 text-center text-red-600 font-semibold">Game Over — no quedan movimientos</div>}

      <p className="mt-3 text-sm text-gray-600">Controles: flechas o WASD. Se generan nuevos tiles tras un movimiento válido.</p>
    </div>
  );
}
