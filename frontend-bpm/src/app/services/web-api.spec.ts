import { TestBed } from '@angular/core/testing';

import { WebApi } from './web-api';

describe('WebApi', () => {
  let service: WebApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
