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

import { NamedArray } from './named-array';

describe("NamedArray", () => {
  let someArray = [
    { name: 'UK', score: 1 },
    { name: 'USA', score: 2 },
    { name: 'Italy', score: 3 }
  ];

  describe("get", () => {
    it('something that exists', () => {
      expect(NamedArray.get(someArray, 'USA')).to.equal(someArray[1]);
    });

    it('something that does not exist', () => {
      expect(NamedArray.get(someArray, 'Russia')).to.equal(null);
    });
  });


  describe("isValid", () => {
    let invalidArr = [
      { name: 'UK', score: 1 },
      { name: 'UK', score: 2 },
      { name: 'Italy', score: 3 }
    ];

    it('invalid array', () => {
      expect(NamedArray.isValid(invalidArr)).to.equal(false);
    });

    it('valid array', () => {
      expect(NamedArray.isValid(someArray)).to.equal(true);
    });
  });

  describe("checkValid", () => {
    let invalidArr = [
      { name: 'UK', score: 1 },
      { name: 'UK', score: 2 },
      { name: 'Italy', score: 3 }
    ];

    it('invalid array', () => {
      expect(
        () => NamedArray.checkValid(invalidArr)
      ).to.throw(`duplicate 'UK'`);
    });

    it('valid array', () => {
      expect(
        () => NamedArray.checkValid(someArray)
      ).to.not.throw();
    });
  });


  describe("containsByName", () => {
    it('something that exists', () => {
      expect(NamedArray.containsByName(someArray, 'USA')).to.equal(true);
    });

    it('something that does not exist', () => {
      expect(NamedArray.containsByName(someArray, 'Russia')).to.equal(false);
    });
  });

  describe("findIndexByName", () => {
    it('something that exists', () => {
      expect(NamedArray.findIndexByName(someArray, 'USA')).to.equal(1);
    });

    it('something that does not exist', () => {
      expect(NamedArray.findIndexByName(someArray, 'Russia')).to.equal(-1);
    });
  });


  describe("overrideByName", () => {
    it('overrides (in order)', () => {
      expect(NamedArray.overrideByName(someArray, { name: 'USA', score: 5 })).to.deep.equal([
        { name: 'UK', score: 1 },
        { name: 'USA', score: 5 },
        { name: 'Italy', score: 3 }
      ]);
    });

    it('overrides appends', () => {
      expect(NamedArray.overrideByName(someArray, { name: 'Russia', score: 5 })).to.deep.equal([
        { name: 'UK', score: 1 },
        { name: 'USA', score: 2 },
        { name: 'Italy', score: 3 },
        { name: 'Russia', score: 5 }
      ]);
    });

  });

  describe("overridesByName", () => {
    it('overrides (in order)', () => {
      expect(NamedArray.overridesByName(someArray, [
        { name: 'USA', score: 52 },
        { name: 'Italy', score: 50 }
        ])).to.deep.equal([
        { name: 'UK', score: 1 },
        { name: 'USA', score: 52 },
        { name: 'Italy', score: 50 }
      ]);
    });

    it('overrides appends', () => {
      expect(NamedArray.overridesByName(someArray, [
        { name: 'Country', score: 0 },
        { name: 'Russia', score: 5 }
        ])).to.deep.equal([
        { name: 'UK', score: 1 },
        { name: 'USA', score: 2 },
        { name: 'Italy', score: 3 },
        { name: 'Country', score: 0 },
        { name: 'Russia', score: 5 }
      ]);
    });

  });


  describe("deleteByName", () => {
    it('something that exists', () => {
      expect(NamedArray.deleteByName(someArray, 'USA')).to.deep.equal([
        { name: 'UK', score: 1 },
        { name: 'Italy', score: 3 }
      ]);
    });

    it('something that does not exist', () => {
      expect(NamedArray.deleteByName(someArray, 'Russia')).to.deep.equal(someArray);
    });
  });


  describe("findByNameCI", () => {
    it('something that exists', () => {
      expect(NamedArray.findByNameCI(someArray, 'usa')).to.deep.equal({ name: 'USA', score: 2 });
      expect(NamedArray.findByNameCI([{ name: 'UsA', score: 2 }], 'uSa')).to.deep.equal({ name: 'UsA', score: 2 });
    });

    it('something that does not exist', () => {
      expect(NamedArray.findByNameCI(someArray, 'RUsSia')).to.equal(null);
    });
  });


  describe('synchronize', () => {
    function valueEqual(a: any, b: any) {
      return a.value === b.value;
    }

    it('one enter', () => {
      let ops: string[] = [];

      NamedArray.synchronize(
        [],
        [{ name: 'A' }],
        {
          equals: valueEqual,
          onEnter: (newThing) => {
            ops.push(`Enter ${newThing.name}`);
          },
          onUpdate: (newThing, oldThing) => {
            ops.push(`Update ${oldThing.name} ${oldThing.value} => ${newThing.value}`);
          },
          onExit: (oldThing) => {
            ops.push(`Exit ${oldThing.name}`);
          }
        }
      );

      expect(ops.join('; ')).to.equal('Enter A');
    });

    it('one exit', () => {
      let ops: string[] = [];

      NamedArray.synchronize(
        [{ name: 'A' }],
        [],
        {
          equals: valueEqual,
          onEnter: (newThing) => {
            ops.push(`Enter ${newThing.name}`);
          },
          onUpdate: (newThing, oldThing) => {
            ops.push(`Update ${oldThing.name} ${oldThing.value} => ${newThing.value}`);
          },
          onExit: (oldThing) => {
            ops.push(`Exit ${oldThing.name}`);
          }
        }
      );

      expect(ops.join('; ')).to.equal('Exit A');
    });

    it('enter / exit', () => {
      let ops: string[] = [];

      NamedArray.synchronize(
        [{ name: 'A' }],
        [{ name: 'B' }],
        {
          equals: valueEqual,
          onEnter: (newThing) => {
            ops.push(`Enter ${newThing.name}`);
          },
          onUpdate: (newThing, oldThing) => {
            ops.push(`Update ${oldThing.name} ${oldThing.value} => ${newThing.value}`);
          },
          onExit: (oldThing) => {
            ops.push(`Exit ${oldThing.name}`);
          }
        }
      );

      expect(ops.join('; ')).to.equal('Enter B; Exit A');
    });

    it('enter / update / exit', () => {
      let ops: string[] = [];

      NamedArray.synchronize(
        [{ name: 'A', value: 1 }, { name: 'B', value: 2 }],
        [{ name: 'B', value: 3 }, { name: 'C', value: 4 }],
        {
          equals: valueEqual,
          onEnter: (newThing) => {
            ops.push(`Enter ${newThing.name}`);
          },
          onUpdate: (newThing, oldThing) => {
            ops.push(`Update ${oldThing.name} ${oldThing.value} => ${newThing.value}`);
          },
          onExit: (oldThing) => {
            ops.push(`Exit ${oldThing.name}`);
          }
        }
      );

      expect(ops.join('; ')).to.equal('Update B 2 => 3; Enter C; Exit A');
    });

  });

});
