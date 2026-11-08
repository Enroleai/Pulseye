import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pluck'
})
export class PluckPipe implements PipeTransform {

  transform(input: any[]): unknown {
    return input.map(value => value);
  }

}
