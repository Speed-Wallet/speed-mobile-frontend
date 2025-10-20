import React from 'react';
import WalletNameInput from './WalletNameInput';

interface CreateWalletContentProps {
  onSubmit: (walletName: string) => void;
  loading?: boolean;
  existingWalletNames: string[];
}

const CreateWalletContent: React.FC<CreateWalletContentProps> = ({
  onSubmit,
  loading = false,
  existingWalletNames,
}) => {
  return (
    <WalletNameInput
      onSubmit={onSubmit}
      loading={loading}
      existingWalletNames={existingWalletNames}
      buttonTitle="Create Wallet"
      loadingTitle="Creating..."
    />
  );
};

export default CreateWalletContent;
