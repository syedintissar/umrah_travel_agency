'use client';

import { FormField } from '@/components/forms/form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** FormField's render-prop form needs a client component: functions cannot cross the server/client boundary. */
export function SelectFieldDemo() {
  return (
    <FormField label="Departure city">
      {(p) => (
        <Select>
          <SelectTrigger {...p} className="w-full"><SelectValue placeholder="Select a city" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="khi">Karachi</SelectItem>
            <SelectItem value="lhe">Lahore</SelectItem>
            <SelectItem value="isb">Islamabad</SelectItem>
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}
