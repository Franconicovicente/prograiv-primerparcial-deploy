import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Quiensoy } from './quiensoy';

describe('Quiensoy', () => {
  let component: Quiensoy;
  let fixture: ComponentFixture<Quiensoy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Quiensoy],
    }).compileComponents();

    fixture = TestBed.createComponent(Quiensoy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
