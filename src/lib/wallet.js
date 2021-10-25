// Client side wallet interactions
import { ethers } from 'ethers'
import { hydrateData } from './data'
import { CHAINDATA } from '../utils/constants'
import { showToast, hideModal } from '../utils/helpers'
import { chainId, signer, provider } from '../stores/wallet'

let _provider;
let _walletConnect;

export async function checkMetamaskSession() {
	if (window.ethereum) connectMetamask(true);
}

export async function connectMetamask(resume) {

	let metamask = window.ethereum;
	if (!metamask) return showToast('Metamask is not installed.');
	
	_provider = new ethers.providers.Web3Provider(metamask);

	let accounts;
	if (resume) {
		accounts = await _provider.send('eth_accounts');
	} else {
		accounts = await _provider.send("eth_requestAccounts", []);
		hideModal();
	}

	const network = await _provider.getNetwork();
	chainId.set(network.chainId);
	metamask.on('chainChanged', (_chainId) => {
		window.location.reload();
	});

	provider.set(_provider);

	console.log('accounts', accounts);

	if (accounts.length) handleAccountsChanged();
	metamask.on('accountsChanged', handleAccountsChanged);

}

export async function connectWalletConnect() {

	let script = document.createElement("script");
	script.setAttribute("src", "https://unpkg.com/@walletconnect/web3-provider@1.6.6/dist/umd/index.min.js");
	document.body.appendChild(script);

	script.addEventListener("load", scriptLoaded, false);

	async function scriptLoaded() {

		_walletConnect = new WalletConnectProvider.default({
			rpc: {
				42161: CHAINDATA[42161].rpc
			}
		});

		await _walletConnect.enable();

		hideModal();

		_provider = new ethers.providers.Web3Provider(_walletConnect);

		provider.set(_provider);
		const network = await _provider.getNetwork();
		chainId.set(network.chainId);

		handleAccountsChanged();

		// Subscribe to accounts change
		_walletConnect.on("accountsChanged", handleAccountsChanged);

		// Subscribe to chainId change
		_walletConnect.on("chainChanged", (chainId) => {
			window.location.reload();
		});

		// Subscribe to session disconnection
		_walletConnect.on("disconnect", (code, reason) => {
			console.log('disconnect', code, reason);
			window.location.reload();
		});

	}

}

export async function disconnectWallet(force) {
	if (force && _walletConnect) await _walletConnect.disconnect();
	signer.set(null);
}

function handleAccountsChanged() {
	signer.set(_provider.getSigner());
	hydrateData();
}

function handleDisconnect() {

}