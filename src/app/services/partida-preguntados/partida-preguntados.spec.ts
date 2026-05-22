import { TestBed } from '@angular/core/testing';

import { PartidaPreguntados } from './partida-preguntados';

describe('PartidaPreguntados', () => {
  let service: PartidaPreguntados;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PartidaPreguntados);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
