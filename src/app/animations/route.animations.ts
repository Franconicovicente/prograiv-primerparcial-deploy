import { trigger, transition, style, animate, query } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(16px)' }),
    ], { optional: true }),
    query(':leave', [
      animate('200ms ease', style({ opacity: 0, transform: 'translateY(-8px)' }))
    ], { optional: true }),
    query(':enter', [
      animate('300ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
    ], { optional: true }),
  ])
]);