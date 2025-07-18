import config from '../../config.js';
import Base_tools_class from '../../core/base-tools.js';
import Base_layers_class from '../../core/base-layers.js';

class Cog_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'cog';
		this.layer = {};
		this.best_ratio = 1;
		this.snap_line_info = {x: null, y: null};
	}

	load() {
		this.default_events();
	}

	mousedown(e) {
		this.shape_mousedown(e);
	}

	mousemove(e) {
		this.shape_mousemove(e);
	}

	mouseup(e) {
		this.shape_mouseup(e);
	}

	render_overlay(ctx){
		var ctx = this.Base_layers.ctx;
		this.render_overlay_parent(ctx);
	}

	demo(ctx, x, y, width, height) {
		ctx.fillStyle = '#777';
		ctx.lineWidth = 1;

		ctx.save();
		ctx.translate(x + width / 2, y + height / 2);
		this.draw_shape(ctx, -width / 2, -height / 2, width, height);
		ctx.restore();
	}

	render(ctx, layer) {
		var params = layer.params;

		ctx.save();

		//set styles
		ctx.fillStyle = params.fill_color;
		ctx.lineWidth = 1;

		//draw with rotation support
		ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
		ctx.rotate(layer.rotate * Math.PI / 180);
		this.draw_shape(ctx, -layer.width / 2, -layer.height / 2, layer.width, layer.height);

		ctx.restore();
	}

	draw_shape(ctx, x, y, width, height, coords) {
		ctx.lineJoin = "round";
		ctx.beginPath();

		//better dont do this, there will be issues with border size
		ctx.scale(width/512, height/500);
		ctx.translate(-256, -252);

		//SVG path
		var p = new Path2D("M190.883 502.932c-4.517 0-9.082-.991-13.368-3.055l-63.216-30.438c-13.348-6.426-20.255-21.479-16.422-35.794 3.684-13.757 8.609-29.81 14.376-46.879a195.425 195.425 0 0 1-15.733-19.711c-17.979 1.837-34.736 3.07-48.937 3.594-14.773.515-27.899-9.536-31.195-23.975L.776 278.273c-3.297-14.444 4.167-29.229 17.748-35.156 13.056-5.697 28.669-11.851 45.59-17.977a193.78 193.78 0 0 1 5.601-24.614c-12.655-12.922-24.061-25.246-33.297-35.989-9.643-11.217-9.939-27.761-.706-39.339l43.744-54.854c9.239-11.584 25.453-14.963 38.552-8.043 12.556 6.636 27.096 15.004 42.466 24.433a194.25 194.25 0 0 1 22.746-10.969c2.209-17.923 4.735-34.522 7.381-48.468 2.757-14.532 15.506-25.079 30.315-25.079h70.161c14.815 0 27.569 10.567 30.325 25.126 2.646 13.983 5.17 30.564 7.377 48.422a193.854 193.854 0 0 1 22.75 10.971c15.42-9.466 29.975-17.843 42.506-24.458 13.079-6.901 29.275-3.512 38.509 8.066l43.743 54.855c9.237 11.582 8.928 28.142-.738 39.374-9.254 10.756-20.646 23.066-33.263 35.957a193.79 193.79 0 0 1 5.601 24.62c16.986 6.145 32.615 12.304 45.634 17.992h.001c13.553 5.923 20.997 20.699 17.701 35.137l-15.615 68.4c-3.299 14.446-16.455 24.532-31.247 23.972-14.229-.531-30.97-1.762-48.889-3.588a195.251 195.251 0 0 1-15.728 19.703c5.791 17.122 10.723 33.189 14.394 46.921 3.819 14.291-3.093 29.324-16.436 35.748l-63.214 30.438c-13.351 6.428-29.426 2.438-38.224-9.484-8.455-11.455-17.931-25.313-27.679-40.466-8.425.548-16.745.548-25.176 0-9.772 15.201-19.257 29.075-27.702 40.508-5.964 8.075-15.283 12.499-24.824 12.5zm-61.851-61.915l61.516 29.619c15.437-20.988 29.097-42.937 36.43-54.579 26.665 3.104 31.829 3.053 58.035.001 6.932 10.997 20.8 33.291 36.445 54.576l61.515-29.619c-6.794-25.207-15.471-49.669-19.957-62.54 19.028-18.834 22.066-22.637 36.219-45.367 13.048 1.451 39.007 4.495 65.388 5.533l15.195-66.562c-24.034-10.441-48.695-18.946-61.337-23.387-2.824-26.58-3.888-31.341-12.882-56.619 9.27-9.299 27.886-27.753 45.083-47.657l-42.566-53.381c-22.622 12.001-44 25.528-56.513 33.37-22.495-14.328-26.889-16.481-52.31-25.228-1.474-12.904-4.292-38.972-9.156-64.958H221.86c-4.53 24.145-7.144 47.395-9.144 64.955-25.185 8.667-29.587 10.755-52.309 25.223-11.055-6.923-33.256-21.009-56.521-33.362l-42.568 53.379c16.896 19.57 35.133 37.669 45.088 47.647-8.943 25.131-10.043 29.878-12.885 56.613-12.366 4.348-37.104 12.879-61.339 23.397l15.192 66.562c25.642-.998 50.721-3.907 65.381-5.542 14.147 22.727 17.192 26.54 36.221 45.377-4.265 12.257-13.059 37.034-19.944 62.549zm351.667-168.554l.009.004-.009-.004zM256 347.486c-50.446 0-91.486-41.041-91.486-91.486s41.041-91.486 91.486-91.486c50.445 0 91.486 41.041 91.486 91.486S306.445 347.486 256 347.486zm0-150.972c-32.801 0-59.486 26.686-59.486 59.486S223.2 315.486 256 315.486 315.486 288.8 315.486 256 288.801 196.514 256 196.514z");

		ctx.closePath();
		ctx.fill(p);
	}

}

export default Cog_class;
