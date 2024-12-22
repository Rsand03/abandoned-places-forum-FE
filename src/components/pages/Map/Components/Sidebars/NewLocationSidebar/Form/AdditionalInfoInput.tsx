import {ChangeEvent} from "react";
import {NewLocationFormData} from "../../../utils.ts";

interface LocationNameFieldProps {
    newLocationFormData: NewLocationFormData;
    setNewLocationFormData: (newData: (prevData) => NewLocationFormData) => void;
}

function AdditionalInformationInput({newLocationFormData, setNewLocationFormData}: LocationNameFieldProps) {

    function updateFormData(event: ChangeEvent<HTMLTextAreaElement>)  {
        setNewLocationFormData((prevData): NewLocationFormData => ({
            ...prevData, additionalInformation: event.target.value,
        }))
    }


    return (
        <div className="mb-3">
            <label htmlFor="additionalInformation" className="block">
                Lisainfo:
            </label>
            <textarea
                name="additionalInformation"
                value={newLocationFormData.additionalInformation}
                onChange={updateFormData}
                className="w-full text-black mb-10 rounded h-12 p-0.5 overflow-auto"
            />
        </div>
    );
}

export default AdditionalInformationInput;
