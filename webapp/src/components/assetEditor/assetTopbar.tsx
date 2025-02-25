import * as React from "react";

import { GalleryView } from './store/assetEditorReducerState';
import { AssetGalleryTab } from './assetGalleryTab'

export class AssetTopbar extends React.Component<{}> {
    render() {
        return <div className="asset-editor-topbar">
            <AssetGalleryTab title={lf("Meus arquivos")} view={GalleryView.User} />
            <AssetGalleryTab title={lf("Galeria")} view={GalleryView.Gallery} />
        </div>
    }
}