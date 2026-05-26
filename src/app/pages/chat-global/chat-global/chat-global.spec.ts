import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatGlobal } from './chat-global';

describe('ChatGlobal', () => {
  let component: ChatGlobal;
  let fixture: ComponentFixture<ChatGlobal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatGlobal],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatGlobal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
