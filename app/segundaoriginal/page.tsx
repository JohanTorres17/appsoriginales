"use client";

import React, { useEffect, useState } from "react";

// Sokoban.tsx
// Componente React (TypeScript) sencillo y autocontenido para jugar Sokoban.
// - Nivel fijo en formato ASCII
// - Movimiento con flechas / WASD
// - Botones: Reset, Undo, Next Level (si hay más niveles)
// - Detección de victoria (todas las cajas en objetivos)

type Cell = "#" | " " | "." | "$" | "@" | "*" | "+"; // pared, suelo, objetivo, caja, jugador, caja+objetivo, jugador+objetivo

const LEVELS: string[] = [
  `
  #####
  #   #
  #$@ #
  # . #
  #####
  `,
  `
  #######
  #  .  #
  #  $  #
  # .$@ #
  #  $  #
  #  .  #
  #######
  `,
];

function parseLevel(ascii: string): Cell[][] {
  const rows = ascii
    .trim()
    .split("\n")
    .map((r) => r.replace(/\r/g, ""));
  return rows.map((r) => r.split("") as Cell[]);
}

function cloneBoard(board: Cell[][]) {
  return board.map((row) => row.slice());
}

function findPlayer(board: Cell[][]): [number, number] | null {
  for (let y = 0; y < board.length; y++)
    for (let x = 0; x < board[y].length; x++) if (board[y][x] === "@" || board[y][x] === "+") return [x, y];
  return null;
}

function isWin(board: Cell[][]) {
  for (let y = 0; y < board.length; y++)
    for (let x = 0; x < board[y].length; x++) if (board[y][x] === "$") return false;
  return true;
}

export default function Sokoban() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [board, setBoard] = useState<Cell[][]>(() => parseLevel(LEVELS[0]));
  const [history, setHistory] = useState<Cell[][][]>([]);
  const [won, setWon] = useState(false);

  useEffect(() => {
    setBoard(parseLevel(LEVELS[levelIndex]));
    setHistory([]);
    setWon(false);
  }, [levelIndex]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key;
      if (key === "ArrowUp" || key.toLowerCase() === "w") move(0, -1);
      if (key === "ArrowDown" || key.toLowerCase() === "s") move(0, 1);
      if (key === "ArrowLeft" || key.toLowerCase() === "a") move(-1, 0);
      if (key === "ArrowRight" || key.toLowerCase() === "d") move(1, 0);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [board]);

  function pushHistory(b: Cell[][]) {
    setHistory((h) => [...h, cloneBoard(b)]);
  }

  function setCell(b: Cell[][], x: number, y: number, val: Cell) {
    b[y][x] = val;
  }

  function move(dx: number, dy: number) {
    if (won) return;
    const p = findPlayer(board);
    if (!p) return;
    const [px, py] = p;
    const tx = px + dx;
    const ty = py + dy;
    if (!board[ty] || board[ty][tx] === undefined) return; // fuera de rango

    const target = board[ty][tx];
    // paredes impiden
    if (target === "#") return;

    const next: Cell[][] = cloneBoard(board);
    pushHistory(board);

    // función auxiliar para cambiar según contenido
    function removePlayer(x: number, y: number) {
      if (next[y][x] === "+") next[y][x] = "."; else next[y][x] = " ";
    }
    function placePlayer(x: number, y: number) {
      if (next[y][x] === ".") next[y][x] = "+"; else next[y][x] = "@";
    }
    function moveBox(x: number, y: number, nx: number, ny: number) {
      // mover caja desde x,y a nx,ny (
      if (next[y][x] === "*") next[y][x] = "."; else next[y][x] = " ";
      if (next[ny][nx] === ".") next[ny][nx] = "*"; else next[ny][nx] = "$";
    }

    if (target === " " || target === ".") {
      // moverse al espacio o objetivo
      removePlayer(px, py);
      placePlayer(tx, ty);
      setBoard(next);
      setWon(isWin(next));
      return;
    }

    // si hay una caja en target, intentar empujar
    if (target === "$" || target === "*") {
      const bx = tx + dx;
      const by = ty + dy;
      if (!next[by] || next[by][bx] === undefined) return; // fuera
      const beyond = next[by][bx];
      if (beyond === "#" || beyond === "$" || beyond === "*") return; // bloqueo

      // empujar caja
      moveBox(tx, ty, bx, by);
      removePlayer(px, py);
      placePlayer(tx, ty);
      setBoard(next);
      setWon(isWin(next));
      return;
    }
  }

  function undo() {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setBoard(cloneBoard(last));
      setWon(isWin(last));
      return h.slice(0, -1);
    });
  }

  function resetLevel() {
    setBoard(parseLevel(LEVELS[levelIndex]));
    setHistory([]);
    setWon(false);
  }

  function nextLevel() {
    setLevelIndex((i) => (i + 1) % LEVELS.length);
  }

  // render
  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-3">Sokoban (TSX)</h2>

      <div className="inline-block bg-gray-200 p-2 rounded">
        {board.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => {
              const key = `${x}-${y}`;
              const size = "w-10 h-10 flex items-center justify-center border";
              let label = "";
              let extra = "";
              if (cell === "#") label = "■";
              if (cell === " ") label = "";
              if (cell === ".") label = "○";
              if (cell === "$") label = "⬛";
              if (cell === "*") label = "⬜";
              if (cell === "@") label = "🙂";
              if (cell === "+") label = "😀";
              return (
                <div key={key} className={`${size} text-lg`} aria-hidden>
                  {label}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={() => move(0, -1)} className="px-3 py-2 border rounded">Arriba</button>
        <button onClick={() => move(-1, 0)} className="px-3 py-2 border rounded">Izquierda</button>
        <button onClick={() => move(1, 0)} className="px-3 py-2 border rounded">Derecha</button>
        <button onClick={() => move(0, 1)} className="px-3 py-2 border rounded">Abajo</button>
      </div>

      <div className="flex gap-2 mt-2">
        <button onClick={undo} className="px-3 py-2 border rounded" disabled={history.length === 0}>Undo</button>
        <button onClick={resetLevel} className="px-3 py-2 border rounded">Reset</button>
        <button onClick={nextLevel} className="px-3 py-2 border rounded">Siguiente Nivel</button>
      </div>

      <p className="mt-3 text-sm text-gray-700">Controles: flechas / WASD. Objetivo: colocar todas las cajas en los objetivos.</p>
      {won && <p className="mt-2 text-green-600 font-semibold">¡Nivel completado!</p>}
    </div>
  );
}
