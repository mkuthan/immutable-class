/*
 * Copyright 2015-2016 Imply Data, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { expect } from "chai";

import { BaseImmutable, Property, PropertyType, BackCompat } from './base-immutable';


interface CarValue {
  name: string;
  fuel: string;
  subCar: Car;
  range?: number;
  relatedCars?: Car[];
  createdOn?: Date;
}

interface CarJS {
  name: string;
  fuel?: string;
  subCar?: CarJS;
  range?: number;
  relatedCars?: CarJS[];
  createdOn?: Date | string;
}

function ensureNonNegative(n: any): void {
  if (n < 0) throw new Error('must non negative positive');
}

class Car extends BaseImmutable<CarValue, CarJS> {
  static PROPERTIES: Property[] = [
    {
      name: 'name',
      validate: (n: string) => {
        if (n.toLowerCase() !== n) throw new Error('must be lowercase');
      }
    },
    {
      name: 'fuel',
      defaultValue: 'electric',
      possibleValues: ['gas', 'diesel', 'electric']
    },
    {
      name: 'subCar',
      defaultValue: null,
      immutableClass: Car
    },
    {
      name: 'range',
      defaultValue: 100,
      validate: [BaseImmutable.ensure.number, ensureNonNegative]
    },
    {
      name: 'relatedCars',
      defaultValue: [],
      immutableClassArray: Car
    },
    {
      name: 'createdOn',
      defaultValue: null,
      type: PropertyType.DATE
    }
  ];

  static BACK_COMPATS: BackCompat[] = [
    {
      condition: (js: any) => {
        return js.fuelType;
      },
      action: (js: any) => {
        js.fuel = js.fuelType;
      }
    }
  ];

  static isCar(car: Car) {
    return car instanceof Car;
  }

  static fromJS(properties: CarJS) {
    return new Car(BaseImmutable.jsToValue(Car.PROPERTIES, properties, Car.BACK_COMPATS));
  }


  public name: string;
  public fuel: string;
  public subCar: Car;
  public range: number;
  public createdOn: Date;

  constructor(properties: CarValue) {
    super(properties);
  }

  public changeFuel: (fuel: string) => this;
  public getFuel: () => string;

  public getRange: () => number;
  public getName: () => string;
  public getRelatedCars: () => Car[];

  public getSubCar() {
    var { name } = this;
    if (name === 'ford') return Car.fromJS({ name: 'pinto', fuel: 'gas' });
    if (name === 'toyota') return Car.fromJS({ name: 'prius' , fuel: 'electric' });
    return null;
  }

  public changeRange(n: number) {
    var value = this.valueOf();
    var { fuel } = value;
    if (fuel === 'electric') {
      value.range = n > 400 ? 400 : n;
      return new Car(value);
    }
    if (fuel === 'diesel') {
      value.range = n > 2000 ? 2000 : n;
      return new Car(value);
    }

    value.range = n;
    return new Car(value);
  }
}
BaseImmutable.finalize(Car);


describe("BaseImmutable", () => {

  it("works with basics", () => {
    var car = Car.fromJS({ name: 'ford', fuel: 'electric' });

    expect(car.get('name')).to.equal('ford');
    expect(car.get('fuel')).to.equal('electric');
    expect(car.getRange()).to.equal(100);

    car = car.change('fuel', 'gas');
    expect(car.get('fuel')).to.equal('gas');

    car = car.changeFuel('diesel');
    expect(car.getFuel()).to.equal('diesel');

    car = car.changeRange(0);
    expect(car.getRange()).to.equal(0);
    expect(car.toJS()).to.deep.equal({
      "fuel": "diesel",
      "name": "ford",
      "range": 0
    });

    expect(car.getRelatedCars()).to.deep.equal([]);

    var car2 = Car.fromJS(car.toJS());
    expect(car2.equals(car)).to.equal(true);
    expect(car2.toJS()).to.deep.equal(car.toJS());
  });

  it("calling general getter calls defined getter", () => {
    var ford = Car.fromJS({ name: 'ford' });
    expect(ford.get('subCar').getName()).to.deep.equal('pinto');
    expect(ford.getSubCar().getName()).to.deep.equal('pinto');

    var toyota = Car.fromJS({ name: 'toyota'});
    expect(toyota.get('subCar').getName()).to.deep.equal('prius');
    expect(toyota.getSubCar().getName()).to.deep.equal('prius');
  });

  it("calling general changer calls defined changer", () => {
    var leaf = Car.fromJS({ name: 'leaf', fuel: 'electric' });
    expect(leaf.change('range', 900).getRange()).to.equal(400);
    expect(leaf.changeRange(900).getRange()).to.equal(400);

    var truck = Car.fromJS({ name: 'truck', fuel: 'diesel' });
    expect(truck.change('range', 900).getRange()).to.equal(900);
    expect(truck.changeRange(900).getRange()).to.equal(900);
  });

  it("works with dates", () => {
    var car = Car.fromJS({ name: 'ford', fuel: 'electric', createdOn: '2016-01-01T01:02:03.456Z' });

    expect(car.toJS()).to.deep.equal({
      "name": "ford",
      "fuel": "electric",
      "createdOn": new Date('2016-01-01T01:02:03.456Z')
    });
  });

  it("works with errors", () => {
    expect(() => {
      Car.fromJS({ fuel: 'electric' } as any);
    }).to.throw('Car.name must be defined');

    expect(() => {
      Car.fromJS({ name: 'Ford', fuel: 'electric' });
    }).to.throw('Car.name must be lowercase');

    expect(() => {
      Car.fromJS({ name: 'ford', fuel: 'farts' });
    }).to.throw("Car.fuel can not have value 'farts' must be one of [gas, diesel, electric]");

    expect(() => {
      Car.fromJS({ name: 'ford', fuel: 'electric', range: ('lol' as any) });
    }).to.throw("Car.range must be a number");

    expect(() => {
      Car.fromJS({ name: 'ford', fuel: 'electric', range: -3 });
    }).to.throw("Car.range must non negative positive");

    expect(() => {
      Car.fromJS({
        name: 'ford',
        fuel: 'electric',
        range: 30,
        relatedCars: (123 as any)
      });
    }).to.throw("expected relatedCars to be an array");

    expect(() => {
      Car.fromJS({
        name: 'ford',
        fuel: 'electric',
        range: 30,
        relatedCars: [
          { name: 'Toyota', fuel: 'electric', range: 31 },
          { name: 'Toyota', fuel: 'electric', range: 32 }
        ]
      });
    }).to.throw("Car.name must be lowercase");

    expect(() => {
      Car.fromJS({
        name: 'ford',
        fuel: 'electric',
        range: 30,
        createdOn: 'time for laughs'
      });
    }).to.throw("Car.createdOn must be a Date");

  });

  it("works with back compat", () => {
    expect(Car.fromJS({
      name: 'ford',
      fuelType: 'electric'
    } as any).toJS()).to.deep.equal({
      name: 'ford',
      fuel: 'electric'
    });
  });

});
