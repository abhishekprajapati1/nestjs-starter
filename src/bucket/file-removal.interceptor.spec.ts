import { BucketService } from './bucket.service';
import { FileRemovalInterceptor } from './file-removal.interceptor';

describe('FileRemovalInterceptor', () => {
  it('should be defined', () => {
    expect(new FileRemovalInterceptor(new BucketService())).toBeDefined();
  });
});
