import { TestBed } from '@angular/core/testing';

import { ThumbnailGeneratorService } from './thumbnail-generator.service';

describe('ThumbnailGeneratorService', () => {
  let service: ThumbnailGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThumbnailGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
