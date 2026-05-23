import { TestBed } from '@angular/core/testing';

import { JuegoPropio } from './juego-propio';

describe('JuegoPropio', () => {
  let service: JuegoPropio;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JuegoPropio);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
