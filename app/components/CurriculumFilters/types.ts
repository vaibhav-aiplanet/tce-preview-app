export interface CurriculumFiltersProps {
    assetId: string;
    asset?: {
        title: string;
        mimeType: string;
        assetType: string;
        subType: string;
    };
    mode: "admin" | "reviewer";
}
