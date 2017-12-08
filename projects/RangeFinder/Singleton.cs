using ArcGIS.Desktop.Framework;
using ArcGIS.Desktop.Framework.Contracts;

namespace RangeFinder
{
    internal class Singleton : Module
    {
        private static Singleton _this;

        /// <summary>
        /// Retrieve the singleton instance to this module here
        /// </summary>
        public static Singleton Current => _this ?? (_this = (Singleton)FrameworkApplication.FindModule("RangeFinder_Module"));

        #region Overrides
        /// <summary>
        /// Called by Framework when ArcGIS Pro is closing
        /// </summary>
        /// <returns>False to prevent Pro from closing, otherwise True</returns>
        protected override bool CanUnload()
        {
            //TODO - add your business logic
            //return false to ~cancel~ Application close
            return true;
        }

        #endregion Overrides

    }
}
