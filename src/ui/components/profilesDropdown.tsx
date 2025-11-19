import React, { useEffect, useState } from "react";

interface Props {
    onSelect?: (profile: string) => void;
}

declare global {
    interface Window {
        api: {
            getProfiles: () => Promise<string[]>;
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
        <div>
            <label htmlFor="profile-select">Select Profile:</label>
            <select id="profile-select" value={selected} onChange={handleChange}>
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
