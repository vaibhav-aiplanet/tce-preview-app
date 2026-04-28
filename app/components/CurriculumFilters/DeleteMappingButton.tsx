import { Button, Spinner } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { deleteMapping } from "~/lib/curriculum-api";
import { useSaving, useDeleting, useReset } from "~/store";

interface DeleteMappingButtonProps {
    assetId: string;
}

export default function DeleteMappingButton({ assetId }: DeleteMappingButtonProps) {
    const [saving] = useSaving();
    const [deleting, setDeleting] = useDeleting();
    const resetAll = useReset();
    const qc = useQueryClient();

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await deleteMapping(assetId);
            resetAll();
            await Promise.all([
                qc.invalidateQueries({ queryKey: ["mapping", assetId] }),
                qc.invalidateQueries({ queryKey: ["mapped-assets"] }),
            ]);
        } catch (error) {
            console.error(error);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Button
            size="sm"
            className="bg-red-600 text-white mr-2"
            onPress={handleDelete}
            isDisabled={saving || deleting}
            isPending={deleting}
        >
            {({ isPending }) => (
                <>
                    {isPending && <Spinner color="current" size="sm" />}
                    {deleting ? "Deleting..." : "Delete"}
                </>
            )}
        </Button>
    );
}
