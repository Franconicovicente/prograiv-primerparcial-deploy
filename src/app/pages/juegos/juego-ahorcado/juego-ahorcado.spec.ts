import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JuegoAhorcado } from './juego-ahorcado';

describe('JuegoAhorcado', () => {
  let component: JuegoAhorcado;
  let fixture: ComponentFixture<JuegoAhorcado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JuegoAhorcado],
    }).compileComponents();

    fixture = TestBed.createComponent(JuegoAhorcado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
