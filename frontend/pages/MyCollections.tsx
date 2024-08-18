import { Link, useNavigate } from "react-router-dom";
import { GetCollectionDataResponse } from "@aptos-labs/ts-sdk";
// Internal components
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LaunchpadHeader } from "@/components/LaunchpadHeader";
import { Image } from "@/components/ui/image";
// Internal hooks
import { useGetCollections } from "@/hooks/useGetCollections";
// Internal constants
import { NETWORK } from "@/constants";

// Custom styles
import "./MyCollections.css"; // Add your custom CSS file here

export function MyCollections() {
  const collections: Array<GetCollectionDataResponse> = useGetCollections();

  // If we are on Production mode, redirect to the mint page
  const navigate = useNavigate();
  if (import.meta.env.PROD) navigate("/", { replace: true });

  return (
    <>
      <LaunchpadHeader title="My Collections" />

      <div className="custom-container">
        <Table className="custom-table">
          {!collections.length && (
            <TableCaption className="custom-caption">
              A list of the collections created under the current contract.
            </TableCaption>
          )}
          <TableHeader className="custom-table-header">
            <TableRow>
              <TableHead className="custom-table-head">Collection</TableHead>
              <TableHead className="custom-table-head">Collection Address</TableHead>
              <TableHead className="custom-table-head">Minted NFTs</TableHead>
              <TableHead className="custom-table-head">Max Supply</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.length > 0 &&
              collections.map((collection: GetCollectionDataResponse) => {
                return (
                  <TableRow key={collection?.collection_id}>
                    <TableCell className="font-medium custom-table-cell">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Image
                          src={collection?.cdn_asset_uris?.cdn_image_uri ?? ""}
                          rounded
                          className="w-10 h-10 bg-gray-100 shrink-0"
                        />
                        <span>{collection?.collection_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="custom-table-cell">
                      <Link
                        to={`https://explorer.aptoslabs.com/object/${collection?.collection_id}?network=${NETWORK}`}
                        target="_blank"
                        className="custom-link"
                      >
                        {collection?.collection_id}
                      </Link>
                    </TableCell>
                    <TableCell className="custom-table-cell">{collection?.total_minted_v2}</TableCell>
                    <TableCell className="custom-table-cell">{collection?.max_supply}</TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
