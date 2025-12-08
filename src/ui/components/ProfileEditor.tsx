
import React, { useEffect, useState } from "react";
import "./ProfileEditor.css";

interface KeywordEntry {
    keyword: string;
    keymap: (string | number)[];
}

interface ProfileData {
    mode: string;
    keywords: KeywordEntry[];
}

interface Row {
    keyword: string;
    controls: string;
}

interface Props {
    profilePath: string;
    onClose: () => void;
    onSave: () => void;
}

const ProfileEditor: React.FC<Props> = ({ profilePath, onClose, onSave }) => {
    const [mode, setMode] = useState("");
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.api.readProfile(profilePath).then((data: any) => {
            if (data) {
                // Initialize mode
                setMode(data.mode || "");

                // Map keywords array to usage rows
                if (Array.isArray(data.keywords)) {
                    const mappedRows = data.keywords.map((k: KeywordEntry) => ({
                        keyword: k.keyword,
                        // Join keymap array for editing: e.g. "press, a"
                        controls: Array.isArray(k.keymap) ? k.keymap.join(", ") : String(k.keymap || "")
                    }));
                    setRows(mappedRows);
                } else {
                    setRows([]);
                }
            }
            setLoading(false);
        });
    }, [profilePath]);

    const handleCellChange = (index: number, field: keyof Row, value: string) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const handleDeleteRow = (index: number) => {
        const newRows = [...rows];
        newRows.splice(index, 1);
        setRows(newRows);
    };

    const handleAddRow = () => {
        setRows([...rows, { keyword: "new_command", controls: "" }]);
    };

    const handleSave = async () => {
        // Reconstruct the profile object
        const newKeywords: KeywordEntry[] = rows.map(row => {
            // Parse controls string back to array of strings/numbers
            const rawParts = row.controls.split(",").map(s => s.trim()).filter(x => x !== "");

            const parsedKeymap = rawParts.map(part => {
                // Check if it's a number
                const num = parseFloat(part);
                return !isNaN(num) && isFinite(num) ? num : part;
            });

            return {
                keyword: row.keyword,
                keymap: parsedKeymap
            };
        });

        const content: ProfileData = {
            mode: mode,
            keywords: newKeywords
        };

        await window.api.saveProfile(profilePath, content);
        onSave();
    };

    if (loading) return <div className="profile-editor-overlay">Loading...</div>;

    return (
        <div className="profile-editor-overlay">
            <div className="profile-editor-content">
                <h2>Editing: {profilePath}</h2>

                <div className="editor-form-group">
                    <label>Mode:</label>
                    <input
                        className="mode-input"
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        placeholder="e.g. xbox, keyboard"
                    />
                </div>

                <div className="editor-table-container">
                    <table className="editor-table">
                        <thead>
                            <tr>
                                <th>Keyword</th>
                                <th>Controls (comma separated)</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <input
                                            value={row.keyword}
                                            onChange={(e) => handleCellChange(idx, "keyword", e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={row.controls}
                                            onChange={(e) => handleCellChange(idx, "controls", e.target.value)}
                                        />
                                    </td>
                                    <td className="col-action">
                                        <button className="icon-btn delete-btn" onClick={() => handleDeleteRow(idx)} title="Delete Command">
                                            <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512" fill="currentColor">
                                                {/* FontAwesome Free 6.x.x by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. */}
                                                <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="editor-footer">
                    <button onClick={handleAddRow} className="secondary-btn">+ Add Command</button>
                    <div className="footer-actions">
                        <button onClick={onClose} className="cancel-btn">Cancel</button>
                        <button onClick={handleSave} className="save-btn">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileEditor;
