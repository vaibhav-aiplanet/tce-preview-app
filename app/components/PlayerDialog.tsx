import { Modal } from "@heroui/react";
import TCEPlayer from "~/components/TCEPlayer";
import CurriculumFilters from "~/components/CurriculumFilters";

interface PlayerDialogProps {
  asset: TCEAsset;
  accessToken: string;
  expiryTime: number;
  expiresIn: number;
  onClose: () => void;
}

export default function PlayerDialog({
  asset,
  accessToken,
  expiryTime,
  expiresIn,
  onClose,
}: PlayerDialogProps) {
  return (
    <Modal.Backdrop
      isOpen={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      variant="blur"
    >
      <Modal.Container size="lg" placement="center">
        <Modal.Dialog className="h-[90vh] max-h-[90vh] w-[95vw] max-w-400 overflow-hidden p-0">
          <Modal.CloseTrigger className="top-3 right-3" />
          <Modal.Header className="px-4 pt-4 pb-2">
            <Modal.Heading>{asset.title || "Untitled"}</Modal.Heading>
          </Modal.Header>
          <CurriculumFilters
            assetId={asset.assetId}
            asset={{
              title: asset.title,
              mimeType: asset.mimeType,
              assetType: asset.assetType,
              subType: asset.subType,
            }}
          />
          <Modal.Body className="flex-1 overflow-hidden p-0">
            <TCEPlayer
              accessToken={accessToken}
              expiryTime={expiryTime}
              expiresIn={expiresIn}
              asset={asset}
            />
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
