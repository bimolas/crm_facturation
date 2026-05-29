"use client";

import { RfpDetail } from "./RfpDetail";

export function MyRfpDetail({
  rfp,
  bids,
  companies,
  onAddCompany,
  onSelectBid,
  onSubmitBid,
  onBack,
}: {
  rfp: any;
  bids: any[];
  companies?: any[];
  onAddCompany?: (name: string) => void;
  onSelectBid: (bid: any) => void;
  onSubmitBid?: (bid: any) => void;
  onBack: () => void;
}) {
  return (
    <RfpDetail
      rfp={rfp}
      bids={bids}
      companies={companies}
      onAddCompany={onAddCompany}
      onSelectBid={onSelectBid}
      onSubmitBid={onSubmitBid}
      onBack={onBack}
      detailVariant="my-rfps"
    />
  );
}
