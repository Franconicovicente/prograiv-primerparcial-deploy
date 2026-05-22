import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth';
import { ChatGlobalComponent } from '../chat-global/chat-global/chat-global';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ChatGlobalComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {

  authService = inject(AuthService)

  ngOnInit(): void {
    
  }

}
