import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: false
})
export class FilterPipe implements PipeTransform {
  transform(items: any[] | null | undefined, query: unknown): any[] {
    if (!Array.isArray(items) || query === null || query === undefined || String(query).trim() === '') {
      return items ?? [];
    }

    const needle = String(query).trim().toLowerCase();
    return items.filter((item) =>
      Object.values(item as object).some((value) => String(value ?? '').toLowerCase().includes(needle))
    );
  }
}
