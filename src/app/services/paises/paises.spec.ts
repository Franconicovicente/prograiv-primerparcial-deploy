import { TestBed } from '@angular/core/testing';

import { Paises } from './paises';

describe('Paises', () => {
  let service: Paises;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Paises);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
