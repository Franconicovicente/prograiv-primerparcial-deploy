import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JuegoMayorMenor } from './juego-mayor-menor';

describe('JuegoMayorMenor', () => {
  let component: JuegoMayorMenor;
  let fixture: ComponentFixture<JuegoMayorMenor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JuegoMayorMenor],
    }).compileComponents();

    fixture = TestBed.createComponent(JuegoMayorMenor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
