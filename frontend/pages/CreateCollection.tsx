import { useRef, useState } from "react";
import { isAptosConnectWallet, useWallet } from "@aptos-labs/wallet-adapter-react";
import { Link, useNavigate } from "react-router-dom";
import { aptosClient } from "@/utils/aptosClient";
import { uploadCollectionData } from "@/utils/assetsUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { LaunchpadHeader } from "@/components/LaunchpadHeader";
import { CREATOR_ADDRESS } from "@/constants";
import { WarningAlert } from "@/components/ui/warning-alert";
import { UploadSpinner } from "@/components/UploadSpinner";
import { LabeledInput } from "@/components/ui/labeled-input";
import { DateTimeInput } from "@/components/ui/date-time-input";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { createCollection } from "@/entry-functions/create_collection";

// Custom styles
import "./CreateCollection.css"; // Add your custom CSS file here

export function CreateCollection() {
  const aptosWallet = useWallet();
  const { account, wallet, signAndSubmitTransaction } = useWallet();
  const navigate = useNavigate();
  if (import.meta.env.PROD) navigate("/", { replace: true });

  const [royaltyPercentage, setRoyaltyPercentage] = useState<number>();
  const [preMintAmount, setPreMintAmount] = useState<number>();
  const [publicMintStartDate, setPublicMintStartDate] = useState<Date>();
  const [publicMintStartTime, setPublicMintStartTime] = useState<string>();
  const [publicMintEndDate, setPublicMintEndDate] = useState<Date>();
  const [publicMintEndTime, setPublicMintEndTime] = useState<string>();
  const [publicMintLimitPerAccount, setPublicMintLimitPerAccount] = useState<number>(1);
  const [publicMintFeePerNFT, setPublicMintFeePerNFT] = useState<number>();
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPublicMintStartTime = (event: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = event.target.value;
    setPublicMintStartTime(timeValue);

    const [hours, minutes] = timeValue.split(":").map(Number);

    publicMintStartDate?.setHours(hours);
    publicMintStartDate?.setMinutes(minutes);
    publicMintStartDate?.setSeconds(0);
    setPublicMintStartDate(publicMintStartDate);
  };

  const onPublicMintEndTime = (event: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = event.target.value;
    setPublicMintEndTime(timeValue);

    const [hours, minutes] = timeValue.split(":").map(Number);

    publicMintEndDate?.setHours(hours);
    publicMintEndDate?.setMinutes(minutes);
    publicMintEndDate?.setSeconds(0);
    setPublicMintEndDate(publicMintEndDate);
  };

  const onCreateCollection = async () => {
    try {
      if (!account) throw new Error("Please connect your wallet");
      if (!files) throw new Error("Please upload files");
      if (account.address !== CREATOR_ADDRESS) throw new Error("Wrong account");
      if (isUploading) throw new Error("Uploading in progress");

      setIsUploading(true);

      const { collectionName, collectionDescription, maxSupply, projectUri } = await uploadCollectionData(
        aptosWallet,
        files,
      );

      const response = await signAndSubmitTransaction(
        createCollection({
          collectionDescription,
          collectionName,
          projectUri,
          maxSupply,
          royaltyPercentage,
          preMintAmount,
          allowList: undefined,
          allowListStartDate: undefined,
          allowListEndDate: undefined,
          allowListLimitPerAccount: undefined,
          allowListFeePerNFT: undefined,
          publicMintStartDate,
          publicMintEndDate,
          publicMintLimitPerAccount,
          publicMintFeePerNFT,
        }),
      );

      const committedTransactionResponse = await aptosClient().waitForTransaction({
        transactionHash: response.hash,
      });

      if (committedTransactionResponse.success) {
        navigate(`/my-collections`, { replace: true });
      }
    } catch (error) {
      alert(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <LaunchpadHeader title="Create New Collection" />

      <div className="custom-container">
        <div className="custom-sidebar">
          <Card className="custom-card">
            <CardHeader className="body-md-semibold">Learn More</CardHeader>
            <CardContent>
              <Link to="https://aptos.dev/standards/digital-asset" className="body-sm underline" target="_blank">
                Find out more about Digital Assets on Aptos
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="custom-content">
          {(!account || account.address !== CREATOR_ADDRESS) && (
            <WarningAlert title={account ? "Wrong account connected" : "No account connected"}>
              To continue with creating your collection, make sure you are connected with a Wallet and with the same
              profile account as in your COLLECTION_CREATOR_ADDRESS in{" "}
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                .env
              </code>{" "}
              file
            </WarningAlert>
          )}

          {wallet && isAptosConnectWallet(wallet) && (
            <WarningAlert title="Wallet not supported">
              Google account is not supported when creating an NFT collection. Please use a different wallet.
            </WarningAlert>
          )}

          <UploadSpinner on={isUploading} />

          <Card className="custom-card">
            <CardHeader>
              <CardDescription>Uploads collection files to Irys, a decentralized storage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start justify-between">
                {!files?.length && (
                  <Label
                    htmlFor="upload"
                    className={buttonVariants({
                      variant: "outline",
                      className: "cursor-pointer",
                    })}
                  >
                    Choose Folder to Upload
                  </Label>
                )}
                <Input
                  className="hidden"
                  ref={inputRef}
                  id="upload"
                  disabled={isUploading || !account || !wallet || isAptosConnectWallet(wallet)}
                  webkitdirectory="true"
                  multiple
                  type="file"
                  placeholder="Upload Assets"
                  onChange={(event) => {
                    setFiles(event.currentTarget.files);
                  }}
                />

                {!!files?.length && (
                  <div>
                    {files.length} files selected{" "}
                    <Button
                      variant="link"
                      className="text-destructive"
                      onClick={() => {
                        setFiles(null);
                        inputRef.current!.value = "";
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex item-center gap-4 mt-4">
            <DateTimeInput
              id="mint-start"
              label="Public mint start date"
              tooltip="When minting becomes active"
              disabled={isUploading || !account}
              date={publicMintStartDate}
              onDateChange={setPublicMintStartDate}
              time={publicMintStartTime}
              onTimeChange={onPublicMintStartTime}
              className="basis-1/2"
            />

            <DateTimeInput
              id="mint-end"
              label="Public mint end date"
              tooltip="When minting finishes"
              disabled={isUploading || !account}
              date={publicMintEndDate}
              onDateChange={setPublicMintEndDate}
              time={publicMintEndTime}
              onTimeChange={onPublicMintEndTime}
              className="basis-1/2"
            />
          </div>

          <LabeledInput
            id="mint-limit"
            required
            label="Mint limit per address"
            tooltip="How many NFTs an individual address is allowed to mint"
            disabled={isUploading || !account}
            onChange={(e) => {
              setPublicMintLimitPerAccount(parseInt(e.target.value));
            }}
          />

          <LabeledInput
            id="royalty-percentage"
            label="Royalty Percentage"
            tooltip="The percentage of trading value that collection creator gets when an NFT is sold on marketplaces"
            disabled={isUploading || !account}
            onChange={(e) => {
              setRoyaltyPercentage(parseInt(e.target.value));
            }}
          />

          <LabeledInput
            id="mint-fee"
            label="Mint fee per NFT in APT"
            tooltip="The fee the nft minter is paying the collection creator when they mint an NFT, denominated in APT"
            disabled={isUploading || !account}
            onChange={(e) => {
              setPublicMintFeePerNFT(Number(e.target.value));
            }}
          />

          <LabeledInput
            id="for-myself"
            label="Mint for myself"
            tooltip="How many NFTs to mint immediately for the creator"
            disabled={isUploading || !account}
            onChange={(e) => {
              setPreMintAmount(parseInt(e.target.value));
            }}
          />

          <ConfirmButton
            title="Create Collection"
            className="self-start"
            onSubmit={onCreateCollection}
            disabled={
              !account ||
              !files?.length ||
              !publicMintStartDate ||
              !publicMintLimitPerAccount ||
              !account ||
              isUploading
            }
            confirmMessage={
              <>
                <p>The upload process requires at least 2 message signatures</p>
                <ol className="list-decimal list-inside">
                  <li>To upload collection cover image file and NFT image files into Irys.</li>

                  <li>To upload collection metadata file and NFT metadata files into Irys.</li>
                </ol>
                <p>In the case we need to fund a node on Irys, a transfer transaction submission is required also.</p>
              </>
            }
          />
        </div>
      </div>
    </>
  );
}
