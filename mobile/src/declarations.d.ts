declare module 'react-native-svg' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  export interface SvgProps extends ViewProps {
    width?: number | string;
    height?: number | string;
    viewBox?: string;
  }

  export class Svg extends Component<SvgProps> {}
  export class Circle extends Component<any> {}
  export class Path extends Component<any> {}
  export class Rect extends Component<any> {}
  export class G extends Component<any> {}
  export class Line extends Component<any> {}
  export default Svg;
}
