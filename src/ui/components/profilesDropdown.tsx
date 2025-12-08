import React from "react";
import "./profilesDropdown.css";

interface Props {
    profiles: string[];
    selectedProfile: string;
    onSelect: (profile: string) => void;
}

declare global {
    interface Window {
        api: {
            getProfiles: () => Promise<string[]>;
            setProfilePath: (filename: string) => Promise<void>;
            startSession: () => Promise<string>;
            stopSession: () => Promise<string>;
            chooseProfileFile: () => Promise<string | null>;
            readProfile: (filename: string) => Promise<any>;
            saveProfile: (filename: string, content: any) => Promise<string>;
        };
    }
}

const ProfilesDropdown: React.FC<Props> = ({ profiles, selectedProfile, onSelect }) => {

    // Internal state moved to App.tsx

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        onSelect(value);
    };

    return (
        <div className="profiles-dropdown-container">
            <select id="profile-select" value={selectedProfile} onChange={handleChange} className="profiles-dropdown-select">
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
