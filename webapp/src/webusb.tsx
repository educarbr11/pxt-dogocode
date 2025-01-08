import * as React from "react";
import * as core from "./core";
import * as cmds from "./cmds";
import { ModalButton } from "./sui";

function resolveFirmwareUrl(): string {
    const boardid = pxt.appTarget?.simulator?.boardDefinition?.id;
    if (boardid) {
        const bundled = pxt.appTarget.bundledpkgs[boardid];
        if (bundled) {
            const cfg = pxt.Package.parseAndValidConfig(bundled[pxt.CONFIG_NAME]);
            if (cfg) {
                return cfg.firmwareUrl;
            }
        }
    }
    return undefined;
}

let userPrefersDownloadFlag = false;

type ConfirmAsync = (options: core.PromptOptions) => Promise<number>;

export async function webUsbPairDialogAsync(pairAsync: () => Promise<boolean>, confirmAsync: ConfirmAsync, implicitlyCalled?: boolean) {
    if (pxt.appTarget.appTheme.downloadDialogTheme) {
        return webUsbPairThemedDialogAsync(pairAsync, confirmAsync, implicitlyCalled);
    }
    else {
        return webUsbPairLegacyDialogAsync(pairAsync, confirmAsync);
    }
}

export async function webUsbPairThemedDialogAsync(pairAsync: () => Promise<boolean>, confirmAsync: ConfirmAsync, implicitlyCalled?: boolean): Promise<number> {
    const boardName = getBoardName();

    if (!implicitlyCalled) {
        clearUserPrefersDownloadFlag();
    }

    const notPairedResult = () => userPrefersDownloadFlag ? pxt.commands.WebUSBPairResult.UserRejected : pxt.commands.WebUSBPairResult.Failed;
    let lastPairingError: any;

    if (!await showConnectDeviceDialogAsync(confirmAsync))
        return notPairedResult();

    let connected = pxt.packetio.isConnected();

    if (!connected && pxt.packetio.isConnecting()) {
        const start = Date.now();
        const TRY_FOR_MS = 2500;
        core.showLoading("attempting-reconnect", lf("Reconnecting to your {0}", boardName));
        try {
            await pxt.Util.promiseTimeout(TRY_FOR_MS, (async () => {
                while (!pxt.packetio.isConnected() && Date.now() < start + TRY_FOR_MS) {
                    await pxt.Util.delay(30);
                }
                connected = pxt.packetio.isConnected();
            })());
        } catch (e) {
            // continue pairing flow
        }
        core.hideLoading("attempting-reconnect");
    }

    let paired = connected;


    if (!connected) {
        // TODO: consider watching .isConnected while showPickWebUSB runs,
        // and hiding the dialog automatically if connection occurs
        // while the modal is still up.
        const webUsbInstrDialogRes = await showPickWebUSBDeviceDialogAsync(confirmAsync, implicitlyCalled);
        connected = pxt.packetio.isConnected();
        if (connected) {
            // plugged in underneath previous dialog, continue;
            core.hideDialog();
        } else if (!webUsbInstrDialogRes) {
            return notPairedResult();
        } else {
            let errMessage: any;
            try {
                paired = await pairAsync();
            } catch (e) {
                errMessage = e.message;
                lastPairingError = e;
            }
            core.hideDialog();

            if (pxt.packetio.isConnected()) {
                // user connected previously paired device &&
                // exitted browser pair dialog without reselecting it;
                // this is fine.
                paired = true;
            } else if (errMessage) {
                // error occured in catch, throw now that we know pairing
                // didn't happen underneath this dialog flow
                core.errorNotification(lf("Pairing error: {0}", errMessage));
                paired = false;
            }
        }
    }


    if (paired && !pxt.packetio.isConnected()) {
        // Confirm connection is valid (not e.g. being controlled by another tab).
        core.showLoading("attempting-connection", lf("Connecting to your {0}", boardName));
        try {
            paired = await cmds.maybeReconnectAsync(
                false /** pairIfDeviceNotFound **/,
                true /** skipIfConnected **/,
            );
        } catch (e) {
            // Error while attempting connection
            paired = false;
            lastPairingError = e;
        }
        core.hideLoading("attempting-connection");
    }

    if (paired) {
        await showConnectionSuccessAsync(confirmAsync, implicitlyCalled);
    }
    else {
        const tryAgain = await showConnectionFailureAsync(confirmAsync, implicitlyCalled, lastPairingError);

        if (tryAgain) return webUsbPairThemedDialogAsync(pairAsync, confirmAsync, implicitlyCalled);
    }

    if (paired) {
        return pxt.commands.WebUSBPairResult.Success;
    } else {
        return notPairedResult();
    }
}

function showConnectDeviceDialogAsync(confirmAsync: ConfirmAsync) {
    const connectDeviceImage = theme().connectDeviceImage;
    const boardName = getBoardName();

    const jsxd = () => (
        connectDeviceImage
            ? <img
                alt={lf("Image connecting {0} to a computer", boardName)}
                className="ui medium rounded image webusb-connect-image"
                src={connectDeviceImage}
            />
            : <div className={`ui one column grid padded download-dialog`}>
            <div className="column">
                <div className="ui">
                    <div className="content">
                        <div className="description">
                            {lf("Primeiro, verifique se seu {0} está conectado em seu computador com o cabo USB.", boardName)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return showPairStepAsync({
        hideClose: true,
        confirmAsync,
        jsxd,
        buttonLabel: lf("Próximo"),
        buttonIcon: pxt.appTarget?.appTheme?.downloadDialogTheme?.deviceIcon,
        header: lf("1. Conectar seu {0} em seu computador", boardName),
        tick: "downloaddialog.button.connectusb",
    });
}

function showPickWebUSBDeviceDialogAsync(confirmAsync: ConfirmAsync, showDownloadAsFileButton?: boolean) {
    const boardName = getBoardName();

    const selectDeviceImage = theme().selectDeviceImage;
    const columns = selectDeviceImage ? "two" : "one";

    const jsxd = () => (
        <div className={`ui ${columns} column grid padded download-dialog`}>
            <div className="column">
                <div className="ui">
                    <div className="content">
                        <div className="description">
                            {lf("Pressione o botão de parear abaixo!")}
                            <br />
                            <br />
                            {lf("Uma janela aparecerá na parte superior do seu navegador.")}
                            <br />
                            <br />
                            {lf("Selecione o dispositivo {0} e clique en conectar.", boardName)}
                        </div>
                    </div>
                </div>
            </div>
            {selectDeviceImage &&
                <div className="column">
                    <div className="ui">
                        <div className="image download-dialog-image">
                            <img alt={lf("Image selecting {0} from a list of WebUSB devices", boardName)} className="ui large rounded image" src={selectDeviceImage} />
                        </div>
                    </div>
                </div>
            }
        </div>
    );

    return showPairStepAsync({
        confirmAsync,
        jsxd,
        buttonLabel: lf("Parear"),
        buttonIcon: pxt.appTarget?.appTheme?.downloadDialogTheme?.deviceIcon,
        showDownloadAsFileButton,
        header: lf("2. Parear seu {0} em seu navegador", boardName),
        tick: "downloaddialog.button.pickusbdevice",
        doNotHideOnAgree: true,
    });
}

function showConnectionSuccessAsync(confirmAsync: ConfirmAsync, willTriggerDownloadOnClose: boolean) {
    const boardName = getBoardName();
    const connectionImage = theme().connectionSuccessImage;
    const columns = connectionImage ? "two" : "one";

    const jsxd = () => (
        <div className={`ui ${columns} column grid padded download-dialog`}>
            <div className="column">
                <div className="ui">
                    <div className="content">
                        <div className="description">
                            {lf("Seu {0} está conectado! Pressione 'Baixar' agora copiará automaticamente seu código para o seu {0}.", boardName)}
                        </div>
                    </div>
                </div>
            </div>
            {connectionImage &&
                <div className="column">
                    <div className="ui">
                        <div className="image download-dialog-image">
                            <img alt={lf("Image of {0}", boardName)} className="ui medium rounded image" src={connectionImage} />
                        </div>
                    </div>
                </div>
            }
        </div>
    );

    return showPairStepAsync({
        confirmAsync,
        jsxd,
        buttonLabel: willTriggerDownloadOnClose ? lf("Baixar") : lf("Feito"),
        buttonIcon: pxt.appTarget.appTheme.downloadDialogTheme?.deviceSuccessIcon,
        header: lf("Conectado ao {0}", boardName),
        tick: "downloaddialog.button.webusbsuccess",
        help: undefined,
        headerIcon: "large circle check purple",
    });
}


function showConnectionFailureAsync(confirmAsync: ConfirmAsync, showDownloadAsFileButton: boolean, error: any) {
    const boardName = getBoardName();
    const tryAgainText = lf("Tentar novamente");
    const helpText = lf("Help");
    const downloadAsFileText = lf("Baixar como arquivo");

    const errorDisplay = error?.type === "devicelocked"
        ? lf("Não foi possível conectar-se ao seu {0}. Pode estar em uso por outro aplicativo.", boardName)
        : lf("Não foi possível encontrar seu {0}.", boardName);
    const jsxd = () => (
        <div>
            <div className="ui content download-troubleshoot-header">
                {errorDisplay}
                <br />
                <br />
                {lf("Clique em \"{0}\" para obter mais informações, em \"{1}\" para tentar emparelhar novamente ou em \"{2}\" para arrastar e soltar.", helpText, tryAgainText, downloadAsFileText)}
            </div>
        </div>
    );


    return showPairStepAsync({
        confirmAsync,
        jsxd,
        buttonLabel: tryAgainText,
        buttonIcon: pxt.appTarget?.appTheme?.downloadDialogTheme?.deviceIcon,
        header: lf("Falha ao se conectar"),
        tick: "downloaddialog.button.webusbfailed",
        help: theme().troubleshootWebUSBHelpURL,
        headerIcon: "exclamation triangle purple",
        showDownloadAsFileButton,
    });
}

interface PairStepOptions {
    confirmAsync: ConfirmAsync;
    jsxd: () => JSX.Element;
    buttonLabel: string;
    buttonIcon?: string;
    header: string;
    tick: string;
    help?: string;
    headerIcon?: string;
    showDownloadAsFileButton?: boolean;
    hideClose?: boolean;
    doNotHideOnAgree?: boolean;
}

async function showPairStepAsync({
    confirmAsync,
    jsxd,
    buttonLabel,
    buttonIcon,
    header,
    tick,
    help,
    headerIcon,
    showDownloadAsFileButton,
    hideClose,
    doNotHideOnAgree,
}: PairStepOptions) {
    let tryAgain = false;

    /**
     * The deferred below is only used when doNotHideOnAgree is set
     */
    let deferred: () => void;
    const agreeButtonClicked = doNotHideOnAgree && new Promise((_res: (val: void) => void, rej: () => void) => {
        deferred = _res;
    });

    const buttons: ModalButton[] = [
        {
            label: buttonLabel,
            className: "primary",
            icon: buttonIcon,
            labelPosition: "left",
            onclick: () => {
                pxt.tickEvent(tick);
                tryAgain = true;
                if (doNotHideOnAgree) {
                    deferred();
                }
            },
            noCloseOnClick: doNotHideOnAgree,
        }
    ];

    if (showDownloadAsFileButton) {
        buttons.unshift({
            label: lf("Baixar como arquivo"),
            className: "secondary",
            icon: pxt.appTarget.appTheme.downloadIcon || "xicon file-download",
            labelPosition: "left",
            onclick: () => {
                pxt.tickEvent("downloaddialog.button.webusb.preferdownload");
                userPrefersDownloadFlag = true;
                tryAgain = false;
            },
        });
    }

    const dialog = confirmAsync({
        header,
        jsxd,
        hasCloseIcon: !hideClose,
        hideCancel: hideClose,
        hideAgree: true,
        className: "downloaddialog",
        helpUrl: help,
        bigHelpButton: !!help,
        headerIcon: headerIcon ? headerIcon + " header-inline-icon" : undefined,
        buttons,
    });

    if (doNotHideOnAgree) {
        await Promise.race([agreeButtonClicked, dialog]);
        // resolve possibly dangling promise
        deferred?.();
    } else {
        await dialog;
    }

    return tryAgain;
}

export function webUsbPairLegacyDialogAsync(pairAsync: () => Promise<boolean>, confirmAsync: ConfirmAsync): Promise<number> {
    let failedOnce = false;
    const boardName = pxt.appTarget.appTheme.boardName || lf("aparelho");
    const helpUrl = pxt.appTarget.appTheme.usbDocs;
    const jsxd = () => {
        const firmwareUrl = failedOnce && resolveFirmwareUrl();
        if (pxt.commands?.renderUsbPairDialog)
            return pxt.commands?.renderUsbPairDialog(firmwareUrl, failedOnce);

        return <div className={`ui ${firmwareUrl ? "four" : "three"} column grid stackable`}>
            {firmwareUrl && <div className="column firmware">
                <div className="ui">
                    <div className="content">
                        <div className="description">
                            {lf("Atualizar Firmware")}
                            <br />
                            <a href={firmwareUrl} target="_blank" rel="noopener noreferrer">{lf("Verifique a versão do firmware e atualize se necessário")}</a>
                        </div>
                    </div>
                </div>
            </div>}
            <div className="column">
                <div className="ui">
                    <div className="content">
                        <div className="description">
                            <span className="ui yellow circular label">1</span>
                            {lf("Conecte {0} ao seu computador com um cabo USB", boardName)}
                            <br />
                        </div>
                    </div>
                </div>
            </div>
            <div className="column">
                <div className="ui">
                    <div className="content">
                        <div className="description">
                            <span className="ui blue circular label">2</span>
                            {lf("Selecione o dispositivo na caixa de diálogo de emparelhamento")}
                        </div>
                    </div>
                </div>
            </div>
            <div className="column">
                <div className="ui">
                    <div className="content">
                        <div className="description">
                            <span className="ui blue circular label">3</span>
                            {lf("Pressione \"Conectar\"")}
                        </div>
                    </div>
                </div>
            </div>
        </div>;
    }

    return new Promise((resolve, reject) => {
        const boardName = getBoardName();

        const confirmOptions = () => {
            return {
                header: lf("Conectar ao seu {0}…", boardName),
                jsxd,
                hasCloseIcon: true,
                hideAgree: true,
                helpUrl,
                className: 'downloaddialog',
                buttons: [
                    {
                        label: lf("Conectar dispositivo"),
                        icon: "usb",
                        className: "primary",
                        onclick: () => {
                            core.showLoading("pair", lf("Selecionar seu {0} e pressionar \"Conectar\".", boardName))
                            pairAsync()
                                .finally(() => {
                                    core.hideLoading("pair")
                                    core.hideDialog();
                                })
                                .then(paired => {
                                    if (paired || failedOnce) {
                                        resolve(paired ? pxt.commands.WebUSBPairResult.Success : pxt.commands.WebUSBPairResult.Failed)
                                    } else {
                                        failedOnce = true;
                                        // allow dialog to fully close, then reopen
                                        core.forceUpdate();
                                        confirmAsync(confirmOptions());
                                    }
                                })
                                .catch(e => {
                                    pxt.reportException(e)
                                    core.errorNotification(lf("Erro de pareamento: {0}", e.message));
                                    resolve(0);
                                });
                        }
                    }
                ]
            }
        };
        confirmAsync(confirmOptions());
    })
}

function getBoardName() {
    return pxt.appTarget.appTheme.boardName || lf("device");
}

function theme() {
    return pxt.appTarget.appTheme.downloadDialogTheme || {};
}

export function renderUnpairDialog() {
    const boardName = getBoardName();
    const header = lf("Como desconectar do seu dispositivo {0}", boardName);
    const unpairImg = theme().browserUnpairImage;
    const jsx = <div>
        <p>
        {lf("Você pode desparear seu {0} se o download WebUSB estiver com problemas.", boardName)}
    </p>
    <p>
        {lf("Clique no ícone no lado esquerdo da barra de endereços e desmarque seu dispositivo.")}
    </p>
    {unpairImg && <img
        className="ui image centered medium"
        src={unpairImg}
        alt={lf("Um gif mostrando como desparear o {0}", boardName)}
    />}
    </div>

    const helpUrl = pxt.appTarget.appTheme.usbDocs
        && (pxt.appTarget.appTheme.usbDocs + "/webusb#unpair");
    return { header, jsx, helpUrl };
}

export function renderDisconnectDeviceDialog() {
    const boardName = getBoardName();
    const disconnectImage = theme().disconnectDeviceImage;

    return <>
       {disconnectImage && <img
        className="ui image centered medium"
        src={disconnectImage}
        alt={lf("Imagem do {0} sendo desconectado", boardName)}
    />}
    <div>
        {lf("Seu {0} parece ter travado", boardName)}
        <br />
        <br />
        {lf("Por favor, desconecte qualquer bateria e conexão USB, e tente novamente.")}
    </div>
    </>;
}

export async function showDeviceForgottenDialog(confirmAsync: ConfirmAsync) {
    const boardName = getBoardName();
    const deviceForgottenImage = theme().usbDeviceForgottenImage;
    const columns = deviceForgottenImage ? "two" : "one";

    const jsxd = () => (
        <div className={`ui ${columns} column grid padded download-dialog`}>
            <div className="column">
                <div className="ui">
                    <div className="content">
                        <div className="description">
                        {lf("Seu {0} foi desconectado.", boardName)}
                        <br />
                        <br />
                        {lf("Desconecte-o do seu computador e retire qualquer bateria para resetá-lo completamente.")}
                        </div>
                    </div>
                </div>
            </div>
            {deviceForgottenImage &&
                <div className="column">
                    <div className="ui">
                        <div className="image download-dialog-image">
                            <img alt={lf("Image of {0} being disconnected", boardName)} className="ui medium rounded image" src={deviceForgottenImage} />
                        </div>
                    </div>
                </div>
            }
        </div>
    );

    await showPairStepAsync({
        confirmAsync,
        jsxd,
        buttonLabel: lf("Done"),
        header: lf("{0} disconnected", boardName),
        tick: "downloaddialog.button.webusbforgotten",
        help: undefined,
    });
}


export function clearUserPrefersDownloadFlag() {
    userPrefersDownloadFlag = false;
}

export function userPrefersDownloadFlagSet() {
    return userPrefersDownloadFlag;
}