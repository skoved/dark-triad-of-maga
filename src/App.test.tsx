// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import { OFFICIALS } from './data/officials';

// jsdom has no layout — give the board a predictable 500x500 box at the origin
// so TriangleBoard's client -> board-coordinate math works.
beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 500,
    bottom: 500,
    width: 500,
    height: 500,
    toJSON: () => ({}),
  } as DOMRect);
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function getBoard() {
  const svg = document.querySelector('svg[data-board]');
  if (!svg) throw new Error('board not rendered');
  return svg;
}

/**
 * Click the board at a point comfortably inside the triangle.
 * Board box is 500x500 (scale 5); triangle apex px (250,50), base px y 435.
 * A 6-column grid in x 170..320, y 240..~400 keeps every click strictly
 * interior for any roster size (rows wrap as the roster grows).
 */
function placeAt(i: number) {
  const cols = [170, 200, 230, 260, 290, 320];
  const clientX = cols[i % cols.length];
  const clientY = 240 + Math.floor(i / cols.length) * 18;
  fireEvent.click(getBoard(), { clientX, clientY });
}

describe('full play-through', () => {
  it('goes title -> playing -> summary -> title and clears storage', () => {
    render(<App />);

    // title screen
    fireEvent.click(screen.getByRole('button', { name: /enter/i }));

    // first prompt visible + progress counter
    expect(screen.getByText(`1 / ${OFFICIALS.length}`)).toBeTruthy();
    expect(document.querySelectorAll('[data-marker]').length).toBe(0);

    placeAt(0);
    // one photo marker now on the board
    expect(document.querySelectorAll('[data-marker]').length).toBe(1);
    expect(screen.getByText(`2 / ${OFFICIALS.length}`)).toBeTruthy();
    expect(localStorage.getItem('dtom:v1')).toBeTruthy();

    for (let i = 1; i < OFFICIALS.length; i++) placeAt(i);

    // summary board
    expect(screen.getByText(/the verdict/i)).toBeTruthy();
    const startOver = screen.getByRole('button', { name: /start over/i });
    // every placed person is listed
    const list = document.querySelector('ul')!;
    expect(within(list).getAllByRole('listitem').length).toBe(OFFICIALS.length);

    fireEvent.click(startOver);

    // back to the title screen, storage wiped
    expect(screen.getByRole('button', { name: /enter/i })).toBeTruthy();
    expect(localStorage.getItem('dtom:v1')).toBeNull();
  });

  it('resumes an in-progress game from localStorage', () => {
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /enter/i }));
    placeAt(0);
    placeAt(1);
    placeAt(2);
    expect(screen.getByText(`4 / ${OFFICIALS.length}`)).toBeTruthy();

    unmount();
    render(<App />);

    // straight back into the game at the same spot, markers restored
    expect(screen.getByText(`4 / ${OFFICIALS.length}`)).toBeTruthy();
    expect(document.querySelectorAll('[data-marker]').length).toBe(3);
  });
});
