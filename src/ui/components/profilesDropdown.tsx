import React, { useEffect, useState } from "react";
import "./profilesDropdown.css";

interface Props {
    onSelect?: (profile: string) => void;
}

declare global {
    interface Window {
        api: {
            getProfiles: () => Promise<string[]>;
            setProfilePath: (filename: string) => Promise<void>;
            startSession: () => Promise<string>;
            stopSession: () => Promise<string>;
            chooseProfileFile: () => Promise<string | null>;
        };
    }
}

const ProfilesDropdown: React.FC<Props> = ({ onSelect }) => {
    const [profiles, setProfiles] = useState<string[]>([]);
    const [selected, setSelected] = useState("");

    useEffect(() => {
        window.api.getProfiles().then(setProfiles);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelected(value);
        onSelect?.(value);
    };

    return (
        <div className="profiles-dropdown-container">
            <label className="profiles-dropdown-label" htmlFor="profile-select">Select Profile:</label>
            <select id="profile-select" value={selected} onChange={handleChange} className="profiles-dropdown-select">
                <option value="" disabled>
                    -- choose a profile --
                </option>
                {profiles.map((name) => (
                    <option key={name} value={name}>
                        {name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ProfilesDropdown;
