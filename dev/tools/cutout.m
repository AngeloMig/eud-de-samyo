// Removes the background from a photo with Apple Vision (subject lifting), crops
// to the subject with a little padding, scales it to a maximum height and writes a
// transparent PNG. macOS 14+.
//
//   clang -fobjc-arc -framework Foundation -framework Vision -framework CoreImage \
//     -framework CoreVideo -framework CoreGraphics dev/tools/cutout.m -o /tmp/cutout
//   /tmp/cutout <in.jpg> <out.png> [maxHeight=1200] [cropBottomPercent=0] [pick=all|left|right] [region=x0,y0,x1,y1]
//
// cropBottomPercent trims that share of the subject's height off the bottom
// (for example a mirror reflection under a bottle). pick keeps only the leftmost
// or rightmost subject Vision finds. region (fractions of the photo, top-left origin)
// crops the photo before cutting out, e.g. to keep a bottle and drop its box.
#import <CoreImage/CoreImage.h>
#import <CoreVideo/CoreVideo.h>
#import <Foundation/Foundation.h>
#import <Vision/Vision.h>

int main(int argc, const char *argv[]) {
  @autoreleasepool {
    if (argc < 3) {
      fprintf(stderr, "usage: cutout <in> <out.png> [maxHeight] [cropBottomPercent]\n");
      return 1;
    }
    NSURL *inURL = [NSURL fileURLWithPath:@(argv[1])];
    NSURL *outURL = [NSURL fileURLWithPath:@(argv[2])];
    double maxHeight = argc > 3 ? atof(argv[3]) : 1200;
    double cropBottom = argc > 4 ? atof(argv[4]) : 0;
    const char *pick = argc > 5 ? argv[5] : "all";

    CIImage *source = [CIImage imageWithContentsOfURL:inURL options:@{kCIImageApplyOrientationProperty : @YES}];
    if (!source) {
      fprintf(stderr, "cannot read %s\n", argv[1]);
      return 1;
    }
    if (argc > 6) {
      double r[4] = {0, 0, 1, 1};
      sscanf(argv[6], "%lf,%lf,%lf,%lf", &r[0], &r[1], &r[2], &r[3]);
      CGRect e = source.extent;
      CGRect crop = CGRectMake(e.origin.x + r[0] * e.size.width, e.origin.y + (1 - r[3]) * e.size.height,
                               (r[2] - r[0]) * e.size.width, (r[3] - r[1]) * e.size.height);
      source = [[source imageByCroppingToRect:crop]
          imageByApplyingTransform:CGAffineTransformMakeTranslation(-crop.origin.x, -crop.origin.y)];
    }

    NSError *error = nil;
    VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCIImage:source options:@{}];
    VNGenerateForegroundInstanceMaskRequest *request = [VNGenerateForegroundInstanceMaskRequest new];
    if (![handler performRequests:@[ request ] error:&error]) {
      fprintf(stderr, "vision failed: %s\n", error.localizedDescription.UTF8String);
      return 2;
    }
    VNInstanceMaskObservation *observation = request.results.firstObject;
    if (!observation) {
      fprintf(stderr, "no subject found in %s\n", argv[1]);
      return 2;
    }
    NSIndexSet *instances = observation.allInstances;
    if (strcmp(pick, "all") != 0 && instances.count > 1) {
      BOOL wantRight = strcmp(pick, "right") == 0;
      __block NSUInteger best = instances.firstIndex;
      __block double bestX = wantRight ? -1 : 1e12;
      [instances enumerateIndexesUsingBlock:^(NSUInteger idx, BOOL *stop) {
        NSError *e = nil;
        CVPixelBufferRef m = [observation generateScaledMaskForImageForInstances:[NSIndexSet indexSetWithIndex:idx]
                                                              fromRequestHandler:handler
                                                                           error:&e];
        if (!m) return;
        CVPixelBufferLockBaseAddress(m, kCVPixelBufferLock_ReadOnly);
        size_t mw = CVPixelBufferGetWidth(m), mh = CVPixelBufferGetHeight(m), rb = CVPixelBufferGetBytesPerRow(m);
        uint8_t *mb = CVPixelBufferGetBaseAddress(m);
        double sum = 0, n = 0;
        for (size_t y = 0; y < mh; y += 2) {
          float *row = (float *)(mb + y * rb);
          for (size_t x = 0; x < mw; x += 2) if (row[x] > 0.5f) { sum += x; n += 1; }
        }
        CVPixelBufferUnlockBaseAddress(m, kCVPixelBufferLock_ReadOnly);
        CVPixelBufferRelease(m);
        if (n == 0) return;
        double cx = sum / n;
        if ((wantRight && cx > bestX) || (!wantRight && cx < bestX)) { bestX = cx; best = idx; }
      }];
      instances = [NSIndexSet indexSetWithIndex:best];
    }
    printf("%s: %lu subject(s) found\n", inURL.lastPathComponent.UTF8String, (unsigned long)observation.allInstances.count);
    CVPixelBufferRef mask = [observation generateScaledMaskForImageForInstances:instances
                                                             fromRequestHandler:handler
                                                                          error:&error];
    if (!mask) {
      fprintf(stderr, "mask failed: %s\n", error.localizedDescription.UTF8String);
      return 2;
    }

    // Subject bounds from the mask. Pixel-buffer rows run top-down.
    CVPixelBufferLockBaseAddress(mask, kCVPixelBufferLock_ReadOnly);
    size_t w = CVPixelBufferGetWidth(mask), h = CVPixelBufferGetHeight(mask);
    size_t rowBytes = CVPixelBufferGetBytesPerRow(mask);
    uint8_t *base = CVPixelBufferGetBaseAddress(mask);
    long minX = w, minY = h, maxX = 0, maxY = 0;
    for (size_t y = 0; y < h; y++) {
      float *row = (float *)(base + y * rowBytes);
      for (size_t x = 0; x < w; x++) {
        if (row[x] > 0.5f) {
          if ((long)x < minX) minX = x;
          if ((long)x > maxX) maxX = x;
          if ((long)y < minY) minY = y;
          if ((long)y > maxY) maxY = y;
        }
      }
    }
    CVPixelBufferUnlockBaseAddress(mask, kCVPixelBufferLock_ReadOnly);
    if (maxX <= minX || maxY <= minY) {
      fprintf(stderr, "empty mask\n");
      return 2;
    }

    CIImage *maskImage = [CIImage imageWithCVPixelBuffer:mask];
    CIFilter *blend = [CIFilter filterWithName:@"CIBlendWithMask"];
    [blend setValue:source forKey:kCIInputImageKey];
    [blend setValue:maskImage forKey:kCIInputMaskImageKey];
    [blend setValue:[CIImage emptyImage] forKey:kCIInputBackgroundImageKey];
    CIImage *cut = blend.outputImage;

    // Convert to Core Image's bottom-up coordinates.
    double subjectHeight = (double)(maxY - minY);
    double trimmedBottomRow = (double)maxY - subjectHeight * cropBottom / 100.0;
    double top = (double)h - (double)minY;
    double bottom = (double)h - trimmedBottomRow;
    double pad = MAX((double)(maxX - minX), top - bottom) * 0.03;
    CGRect rect = CGRectMake(minX - pad, bottom - pad, (maxX - minX) + pad * 2, (top - bottom) + pad * 2);
    rect = CGRectIntersection(rect, source.extent);

    CIImage *output = [[cut imageByCroppingToRect:rect]
        imageByApplyingTransform:CGAffineTransformMakeTranslation(-rect.origin.x, -rect.origin.y)];
    double scale = MIN(1.0, maxHeight / rect.size.height);
    if (scale < 1.0) {
      CIFilter *lanczos = [CIFilter filterWithName:@"CILanczosScaleTransform"];
      [lanczos setValue:output forKey:kCIInputImageKey];
      [lanczos setValue:@(scale) forKey:kCIInputScaleKey];
      [lanczos setValue:@1.0 forKey:kCIInputAspectRatioKey];
      output = lanczos.outputImage;
    }

    CIContext *context = [CIContext context];
    CGColorSpaceRef srgb = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    BOOL ok = [context writePNGRepresentationOfImage:output
                                               toURL:outURL
                                              format:kCIFormatRGBA8
                                          colorSpace:srgb
                                             options:@{}
                                               error:&error];
    CGColorSpaceRelease(srgb);
    CVPixelBufferRelease(mask);
    if (!ok) {
      fprintf(stderr, "write failed: %s\n", error.localizedDescription.UTF8String);
      return 3;
    }
    printf("%s: %dx%d\n", outURL.lastPathComponent.UTF8String, (int)output.extent.size.width,
           (int)output.extent.size.height);
  }
  return 0;
}
