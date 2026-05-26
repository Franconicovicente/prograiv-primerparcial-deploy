import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JuegoPreguntados } from './juego-preguntados';

describe('JuegoPreguntados', () => {
  let component: JuegoPreguntados;
  let fixture: ComponentFixture<JuegoPreguntados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JuegoPreguntados],
    }).compileComponents();

    fixture = TestBed.createComponent(JuegoPreguntados);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
