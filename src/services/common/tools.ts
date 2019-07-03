import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { outputPanel } from '../../extension';
import { config } from './config';
import { ExportRport } from '../exporter/interfaces';

export function calculateExportPath(uri: vscode.Uri, format: string): string {
    let outDirName = config.exportOutDirName;
    let dir = "";
    let folder = vscode.workspace.getWorkspaceFolder(uri);
    let wkdir = folder ? folder.uri.fsPath : "";
    //if current document is in workspace, organize exports in 'out' directory.
    //if not, export beside the document.
    if (wkdir && isSubPath(uri.fsPath, wkdir)) dir = path.join(wkdir, outDirName);

    let exportDir = path.dirname(uri.fsPath);
    if (!path.isAbsolute(exportDir)) return "";
    if (dir && wkdir) {
        let temp = path.relative(wkdir, exportDir);
        exportDir = path.join(dir, temp);
    }

    return path.join(exportDir, path.basename(uri.fsPath, ".md") + `.${format.toLowerCase()}`);
}

export function isSubPath(from: string, to: string): boolean {
    let rel = path.relative(to, from);
    return !(path.isAbsolute(rel) || rel.substr(0, 2) == "..")
}

export function mkdirs(dirname, callback) {
    fs.exists(dirname, function (exists) {
        if (exists) {
            callback();
        } else {
            mkdirs(path.dirname(dirname), function () {
                fs.mkdir(dirname, callback);
            });
        }
    });
}

export function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

export function parseError(error: any): string {
    let nb = Buffer.alloc(0);
    if (typeof (error) === "string") {
        return error;
    } else if (error instanceof TypeError || error instanceof Error) {
        let err = error as TypeError;
        return err.message + '\n' + err.stack;
    } else if (error instanceof Array) {
        let arrs = error as any[];
        return arrs.reduce((p, err) => p + '\n\n' + err.message + '\n' + err.stack, "");
    } else {
        return error.toString();
    }
}

export function showMessagePanel(message: any) {
    outputPanel.clear();
    outputPanel.appendLine(parseError(message));
    outputPanel.show();
}

export function mergeSettings(...args: any[]) {
    return args.reduce((p, c) => {
        return Object.assign(p, c);
    }, {});
}

export async function showExportReport(report: ExportRport) {
    let msg = `${report.files.length} file(s) exported in ${report.duration / 1000} seconds`;
    let viewReport = "View Report";
    let btn = await vscode.window.showInformationMessage(msg, viewReport);
    if (btn !== viewReport) return;
    let rpt = `${msg}:\n\n` + report.files.join('\n');
    showMessagePanel(rpt);
}
