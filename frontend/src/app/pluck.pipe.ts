import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'pluck',
    standalone: false
})
export class PluckPipe implements PipeTransform {

  transform(input: any[]): any[] {
    return input.map(value => value);
  }

}
