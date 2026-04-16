import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';
import { getCroppedImage } from '@/lib/imageUtils';

interface ImageCropperProps {
  file: File | null;
  open: boolean;
  onClose: () => void;
  onCropped: (file: File) => void;
  aspect?: number;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropper({ file, open, onClose, onCropped, aspect = 2 / 3 }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc, setImgSrc] = useState('');

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImgSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImgSrc('');
    }
  }, [file]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    },
    [aspect]
  );

  const handleConfirm = async () => {
    if (!imgRef.current || !crop || !crop.width || !crop.height) return;

    const pixelCrop = {
      x: (crop.x / 100) * imgRef.current.width,
      y: (crop.y / 100) * imgRef.current.height,
      width: (crop.width / 100) * imgRef.current.width,
      height: (crop.height / 100) * imgRef.current.height,
    };

    // If crop is percentage-based
    if (crop.unit === '%') {
      // already converted above
    } else {
      // pixel-based
      Object.assign(pixelCrop, { x: crop.x, y: crop.y, width: crop.width, height: crop.height });
    }

    const croppedFile = await getCroppedImage(imgRef.current, pixelCrop);
    onCropped(croppedFile);
    onClose();
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="parchment-bg border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Recortar Imagem</DialogTitle>
          <DialogDescription className="sr-only">Ajuste o recorte da imagem</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center max-h-[60vh] overflow-auto">
          <ReactCrop crop={crop} onChange={c => setCrop(c)} aspect={aspect}>
            <img
              ref={imgRef}
              src={imgSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-h-[55vh]"
            />
          </ReactCrop>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="font-display">
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
          <Button onClick={handleConfirm} className="bg-primary text-primary-foreground font-display">
            <Check className="h-4 w-4 mr-1" /> Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
