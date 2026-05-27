import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultadoEncuestas } from './resultado-encuestas';

describe('ResultadoEncuestas', () => {
  let component: ResultadoEncuestas;
  let fixture: ComponentFixture<ResultadoEncuestas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultadoEncuestas],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultadoEncuestas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
