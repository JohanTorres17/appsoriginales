"use client";

import React, { useState } from "react";

// Sudoku.tsx
// Componente React (TypeScript) sencillo para renderizar y jugar un Sudoku 9x9.
// - Tablero inicial fijo (0 = vacío)
// - Permite ingresar números 1-9 en celdas vacías
// - Botones: Comprobar, Reset, Solucionar
// - Resalta conflictos (filas, columnas, cajas)

type Board = number[][];

const STARTING_BOARD: Board = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

function cloneBoard(b: Board): Board {
  return b.map((r) => r.slice());
}

function isValidPlacement(board: Board, row: number, col: number, val: number) {
  if (val === 0) return true;
  // fila
  for (let c = 0; c < 9; c++) if (c !== col && board[row][c] === val) return false;
  // columna
  for (let r = 0; r < 9; r++) if (r !== row && board[r][col] === val) return false;
  // caja 3x3
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++) if (!(r === row && c === col) && board[r][c] === val) return false;
  return true;
}

function findConflicts(board: Board) {
  const conflicts: Set<string> = new Set();
  // revisar cada celda no vacía y ver si hay duplicados en su fila/col/caja
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (v === 0) continue;
      // fila
      for (let cc = 0; cc < 9; cc++) {
        if (cc !== c && board[r][cc] === v) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${r},${cc}`);
        }
      }
      // columna
      for (let rr = 0; rr < 9; rr++) {
        if (rr !== r && board[rr][c] === v) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${rr},${c}`);
        }
      }
      // caja
      const br = Math.floor(r / 3) * 3;
      const bc = Math.floor(c / 3) * 3;
      for (let rr = br; rr < br + 3; rr++) {
        for (let cc = bc; cc < bc + 3; cc++) {
          if ((rr !== r || cc !== c) && board[rr][cc] === v) {
            conflicts.add(`${r},${c}`);
            conflicts.add(`${rr},${cc}`);
          }
        }
      }
    }
  }
  return conflicts;
}

function solveBoard(board: Board): Board | null {
  const b = cloneBoard(board);

  function findEmpty(): [number, number] | null {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (b[r][c] === 0) return [r, c];
    return null;
  }

  function backtrack(): boolean {
    const empty = findEmpty();
    if (!empty) return true; // resuelto
    const [r, c] = empty;
    for (let n = 1; n <= 9; n++) {
      if (isValidPlacement(b, r, c, n)) {
        b[r][c] = n;
        if (backtrack()) return true;
        b[r][c] = 0;
      }
    }
    return false;
  }

  if (backtrack()) return b;
  return null;
}

export default function Sudoku() {
  const [board, setBoard] = useState<Board>(cloneBoard(STARTING_BOARD));
  const [conflicts, setConflicts] = useState<Set<string>>(new Set());

  const isClue = (r: number, c: number) => STARTING_BOARD[r][c] !== 0;

  function handleChange(r: number, c: number, raw: string) {
    const ch = raw.replace(/[^1-9]/g, "");
    const val = ch === "" ? 0 : parseInt(ch, 10);
    setBoard((prev) => {
      const next = cloneBoard(prev);
      next[r][c] = val;
      return next;
    });
    // limpiamos conflictos en cada cambio (se recalcularán con "Comprobar")
    setConflicts(new Set());
  }

  function handleCheck() {
    const c = findConflicts(board);
    setConflicts(c);
    if (c.size === 0 && board.flat().every((n) => n !== 0)) {
      alert("¡Correcto! Sudoku completado sin conflictos.");
    } else if (c.size === 0) {
      alert("Sin conflictos por ahora, pero faltan celdas por llenar.");
    } else {
      alert("Hay conflictos. Se han marcado en rojo.");
    }
  }

  function handleReset() {
    setBoard(cloneBoard(STARTING_BOARD));
    setConflicts(new Set());
  }

  function handleSolve() {
    // Intentar resolver a partir del tablero actual;
    // si falla, intentar resolver el tablero inicial (para obtener solución completa).
    let solved = solveBoard(board);
    if (!solved) {
      solved = solveBoard(STARTING_BOARD);
      if (solved) {
        setBoard(solved);
        setConflicts(new Set());
        alert("No se pudo resolver a partir del estado actual; mostrando solución del tablero inicial.");
        return;
      }
      alert("No se puede resolver el tablero (posible inconsistencia). Intenta resetear o corregir entradas.");
      return;
    }
    setBoard(solved);
    setConflicts(new Set());
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Sudoku (TSX)</h2>
      <div className="grid grid-cols-9 gap-0 border-2 border-gray-300" style={{ lineHeight: 0 }}>
        {board.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r}-${c}`;
            const readOnly = isClue(r, c);
            const posKey = `${r},${c}`;
            const hasConflict = conflicts.has(posKey);
            const baseClasses =
              "w-10 h-10 text-center outline-none text-lg p-0 leading-10 border";
            const borderClasses =
              (c % 3 === 2 ? "border-r-2" : "") +
              " " +
              (r % 3 === 2 ? "border-b-2" : "") +
              " " +
              (c % 3 === 0 ? "border-l-" : "") ;

            return (
              <input
                key={key}
                value={cell === 0 ? "" : String(cell)}
                readOnly={readOnly}
                onChange={(e) => handleChange(r, c, e.target.value)}
                className={`${baseClasses} ${
                  readOnly ? "bg-gray-100 font-medium" : "bg-white"
                } ${hasConflict ? "border-red-500" : "border-gray-300"}`}
                style={{
                  borderTopWidth: r % 3 === 0 ? 2 : 1,
                  borderLeftWidth: c % 3 === 0 ? 2 : 1,
                }}
                inputMode="numeric"
                maxLength={1}
              />
            );
          })
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleCheck}
          className="px-3 py-2 rounded shadow-sm border"
        >
          Comprobar
        </button>
        <button onClick={handleReset} className="px-3 py-2 rounded shadow-sm border">
          Reset
        </button>
        <button onClick={handleSolve} className="px-3 py-2 rounded shadow-sm border">
          Solucionar
        </button>
      </div>

      <p className="text-sm mt-3 text-gray-600">Celdas en gris son pistas (no editables). Las rojas indican conflictos.</p>
    </div>
  );
}
