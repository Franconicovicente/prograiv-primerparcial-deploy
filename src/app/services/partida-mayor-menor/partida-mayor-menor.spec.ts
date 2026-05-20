import { TestBed } from '@angular/core/testing';

import { PartidaMayorMenor } from './partida-mayor-menor';

describe('PartidaMayorMenor', () => {
  let service: PartidaMayorMenor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PartidaMayorMenor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
